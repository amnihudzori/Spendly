import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { createElement } from 'react'
import { createServer } from 'vite'
import { createEmptyState, dateKey, STORAGE_KEY, monthKey } from '../src/lib/finance.js'

test('wallet funding, income editing, analytics, and saved-data compatibility', async (t) => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/Spendly/', pretendToBeVisual: true })
  const originalGlobals = new Map()
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLDialogElement', 'SVGElement', 'Node', 'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'MutationObserver', 'FormData', 'localStorage', 'getComputedStyle']) {
    originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[key] })
  }
  window.scrollTo = () => {}
  const NativeResizeObserver = globalThis.ResizeObserver
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
  window.ResizeObserver = globalThis.ResizeObserver
  if (!HTMLDialogElement.prototype.showModal) HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  if (!HTMLDialogElement.prototype.close) HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  const { render, screen, within, cleanup, fireEvent } = await import('@testing-library/react')
  const { default: userEvent } = await import('@testing-library/user-event')
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  const user = userEvent.setup({ document: dom.window.document })
  const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY))
  const balance = () => document.querySelector('.balance-amount').textContent
  const openLink = async (name) => user.click(screen.getAllByRole('link', { name, exact: true })[0])
  const openAnalytics = async () => {
    await openLink('Analytics')
    await screen.findByRole('heading', { name: 'Analytics', exact: true }, { timeout: 15000 })
  }
  const change = async (field, value) => { await user.clear(field); if (value) await user.type(field, value) }
  const remount = (path = '/home') => { cleanup(); window.history.replaceState({}, '', '/Spendly' + path); render(createElement(App)) }
  const originalConsoleWarn = console.warn
  console.warn = (...args) => { if (!String(args[0]).includes('width') && !String(args[0]).includes('height')) originalConsoleWarn(...args) }
  try {
    render(createElement(App))
    await t.test('new users start with an empty wallet, never automatic sample money', async () => {
      await user.click(screen.getByRole('button', { name: /Get Started/ }))
      assert.equal(balance(), 'RM 0.00')
      assert.deepEqual(saved().transactions, [])
      assert.equal(saved().initialBalance, null)
      assert.equal(localStorage.length, 1)
      assert.ok(screen.getByRole('link', { name: 'Add Money' }))
      assert.ok(screen.getByRole('button', { name: 'Set Initial Balance' }))
    })
    await t.test('initial balance requires valid input and does not create monthly income', async () => {
      await user.click(screen.getByRole('button', { name: 'Set Initial Balance' }))
      const field = screen.getByLabelText('Initial balance (MYR)')
      await user.click(screen.getByRole('button', { name: 'Save initial balance' }))
      assert.equal(saved().initialBalance, null)
      await change(field, '-10')
      await user.click(screen.getByRole('button', { name: 'Save initial balance' }))
      assert.equal(saved().initialBalance, null)
      await change(field, '500')
      await user.click(screen.getByRole('button', { name: 'Save initial balance' }))
      assert.equal(balance(), 'RM 500.00')
      assert.equal(saved().initialBalance, 500)
      assert.deepEqual(saved().transactions, [])
      assert.equal(document.querySelector('.balance-flows strong').textContent, 'RM 0.00')
    })
    await t.test('re-saving the initial balance cannot add it twice', async () => {
      await user.click(screen.getByRole('button', { name: 'Edit initial balance' }))
      assert.equal(screen.getByLabelText('Initial balance (MYR)').value, '500.00')
      await user.click(screen.getByRole('button', { name: 'Update initial balance' }))
      assert.equal(balance(), 'RM 500.00')
      assert.equal(saved().transactions.length, 0)
      assert.equal(screen.queryByRole('button', { name: 'Set Initial Balance' }), null)
    })
    await t.test('Add Money opens Income with all requested source choices', async () => {
      await openLink('Add Money')
      assert.equal(window.location.pathname, '/Spendly/add')
      assert.equal(window.location.search, '?type=income')
      assert.ok(screen.getByRole('heading', { name: 'Add Income' }))
      assert.equal(screen.getByRole('button', { name: 'Income', exact: true }).getAttribute('aria-pressed'), 'true')
      for (const source of ['Allowance', 'Salary', 'Part-time Job', 'Gift', 'Other']) assert.ok(screen.getByRole('button', { name: source, exact: true }))
      assert.equal(screen.queryByRole('button', { name: 'Freelance', exact: true }), null)
    })
    await t.test('income rejects empty amount/source/date, zero, negative, and overprecision amounts', async () => {
      const amount = screen.getByLabelText('Amount')
      await user.click(screen.getByRole('button', { name: 'Save Income' }))
      assert.equal(saved().transactions.length, 0)
      await change(amount, '200')
      await user.click(screen.getByRole('button', { name: 'Save Income' }))
      assert.equal(screen.getByRole('alert').textContent, 'Choose a category.')
      await user.click(screen.getByRole('button', { name: 'Allowance', exact: true }))
      for (const value of ['0', '-5', '1.001']) {
        await change(amount, value)
        await user.click(screen.getByRole('button', { name: 'Save Income' }))
        assert.equal(saved().transactions.length, 0)
      }
      await change(amount, '200')
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: '' } })
      await user.click(screen.getByRole('button', { name: 'Save Income' }))
      assert.equal(saved().transactions.length, 0)
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: dateKey() } })
      await user.type(screen.getByLabelText(/Description/), 'Weekly allowance')
      await user.click(screen.getByRole('button', { name: 'Save Income' }))
      assert.equal(balance(), 'RM 700.00')
      assert.equal(saved().transactions.length, 1)
      assert.equal(saved().transactions[0].type, 'income')
      assert.equal(saved().transactions[0].amount, 200)
    })
    await t.test('income-only analytics includes earned money but excludes the starting balance', async () => {
      await openAnalytics()
      assert.equal(document.querySelector('.monthly-income').textContent, 'RM 200.00')
      assert.equal(document.querySelector('.monthly-net').textContent, 'RM 200.00')
      assert.equal(document.querySelector('.spending-banner strong').textContent, 'RM 0.00')
      assert.ok(screen.getByText('Your picture starts here'))
      await openLink('Home')
    })
    await t.test('expenses subtract from initial balance plus income', async () => {
      await openLink('Add transaction')
      assert.ok(screen.getByRole('heading', { name: 'Add Expense' }))
      await user.type(screen.getByLabelText('Amount'), '25.50')
      await user.click(screen.getByRole('button', { name: 'Food', exact: true }))
      await user.type(screen.getByLabelText(/Description/), 'QA coffee')
      await user.click(screen.getByRole('button', { name: 'Save Expense' }))
      assert.equal(balance(), 'RM 674.50')
    })
    await t.test('income records can be edited, including their source, amount, date, and description', async () => {
      await user.click(screen.getByRole('button', { name: /View Weekly allowance/ }))
      await user.click(screen.getByRole('link', { name: 'Edit transaction' }))
      assert.ok(screen.getByRole('heading', { name: 'Edit Income' }))
      await change(screen.getByLabelText('Amount'), '250')
      await user.click(screen.getByRole('button', { name: 'Part-time Job', exact: true }))
      await change(screen.getByLabelText(/Description/), 'Campus job')
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: `${monthKey()}-01` } })
      await user.click(screen.getByRole('button', { name: 'Save Changes' }))
      assert.equal(saved().transactions.find((item) => item.type === 'income').category, 'part-time')
      assert.equal(saved().transactions.find((item) => item.type === 'income').date, `${monthKey()}-01`)
      await user.click(screen.getByRole('button', { name: 'Income', exact: true }))
      assert.equal(document.querySelectorAll('.transaction-row').length, 1)
      assert.ok(screen.getByRole('button', { name: /View Campus job/ }))
      await openLink('Home')
      assert.equal(balance(), 'RM 724.50')
      await openAnalytics()
      assert.equal(document.querySelector('.monthly-income').textContent, 'RM 250.00')
      assert.equal(document.querySelector('.monthly-net').textContent, 'RM 224.50')
      await openLink('Home')
    })
    await t.test('deleting income immediately reduces the wallet and analytics totals', async () => {
      await user.click(screen.getByRole('button', { name: /View Campus job/ }))
      await user.click(screen.getByRole('button', { name: 'Delete', exact: true }))
      await user.click(screen.getByRole('button', { name: 'Delete', exact: true }))
      assert.equal(balance(), 'RM 474.50')
      await openAnalytics()
      assert.equal(document.querySelector('.monthly-income').textContent, 'RM 0.00')
      assert.equal(document.querySelector('.monthly-net').textContent, 'RM -25.50')
      await openLink('Home')
    })
    await t.test('description is optional and history search/source/month filters work', async () => {
      await openLink('Add Money')
      await user.type(screen.getByLabelText('Amount'), '40')
      await user.click(screen.getByRole('button', { name: 'Gift', exact: true }))
      await user.click(screen.getByRole('button', { name: 'Save Income' }))
      assert.equal(balance(), 'RM 514.50')
      await openLink('History')
      assert.ok(screen.getByRole('button', { name: /View Gift/ }))
      await user.type(screen.getByRole('searchbox'), 'gift')
      assert.equal(document.querySelectorAll('.transaction-row').length, 1)
      await user.click(screen.getByRole('button', { name: 'Expenses', exact: true }))
      assert.ok(screen.getByText('No matching transactions'))
      await user.click(screen.getByRole('button', { name: 'Clear filters' }))
      await user.click(screen.getByRole('button', { name: 'Filter by category' }))
      await user.selectOptions(screen.getByLabelText('Category'), 'gift')
      assert.equal(document.querySelectorAll('.transaction-row').length, 1)
      await user.click(screen.getByRole('button', { name: 'Previous month' }))
      assert.ok(screen.getByText('No matching transactions'))
    })
    await t.test('initial balance editing replaces the old value and all wallet data survives reload', async () => {
      await openLink('Home')
      await user.click(screen.getByRole('button', { name: 'Edit initial balance' }))
      await change(screen.getByLabelText('Initial balance (MYR)'), '600')
      await user.click(screen.getByRole('button', { name: 'Update initial balance' }))
      assert.equal(balance(), 'RM 614.50')
      assert.equal(saved().transactions.length, 2)
      remount('/')
      assert.equal(window.location.pathname, '/Spendly/home')
      assert.equal(balance(), 'RM 614.50')
      assert.equal(saved().initialBalance, 600)
      assert.equal(saved().transactions.length, 2)
    })
    await t.test('profile, budget, currency, and reminders still work with the funded wallet', async () => {
      await openLink('Profile')
      await user.click(screen.getByRole('button', { name: 'Edit profile' }))
      await change(screen.getByLabelText('Name'), 'Jamie Tan')
      await user.click(screen.getByRole('button', { name: 'Save profile' }))
      await user.click(screen.getByRole('button', { name: /Monthly budget/ }))
      await change(screen.getByLabelText(/Monthly spending limit/), '100')
      await user.click(screen.getByRole('button', { name: 'Save budget' }))
      await user.click(screen.getByRole('switch', { name: 'Budget reminders' }))
      await user.click(screen.getByRole('button', { name: /^Currency/ }))
      await user.selectOptions(screen.getByLabelText('Currency'), 'SGD')
      await user.click(screen.getByRole('button', { name: 'Save currency' }))
      await openLink('Home')
      assert.equal(balance(), 'S$ 614.50')
      assert.equal(screen.getByRole('progressbar').getAttribute('aria-valuetext'), '26% of budget spent')
      assert.equal(saved().profile.name, 'Jamie Tan')
      assert.equal(saved().profile.notifications, false)
    })
    await t.test('zero initial balance stays set across reloads and is never treated as unset', async () => {
      await user.click(screen.getByRole('button', { name: 'Edit initial balance' }))
      await change(screen.getByLabelText('Initial balance (SGD)'), '0')
      await user.click(screen.getByRole('button', { name: 'Update initial balance' }))
      assert.equal(balance(), 'S$ 14.50')
      remount()
      assert.equal(saved().initialBalance, 0)
      assert.ok(screen.getByRole('button', { name: 'Edit initial balance' }))
      assert.equal(screen.queryByRole('button', { name: 'Set Initial Balance' }), null)
    })
    await t.test('clearing transactions requires confirmation and keeps initial balance and settings', async () => {
      await openLink('Profile')
      await user.click(screen.getByRole('button', { name: /Clear all transactions/ }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Keep my data' }))
      assert.equal(saved().transactions.length, 2)
      await user.click(screen.getByRole('button', { name: /Clear all transactions/ }))
      await user.click(screen.getByRole('button', { name: 'Clear transactions', exact: true }))
      assert.deepEqual(saved().transactions, [])
      assert.equal(saved().initialBalance, 0)
      assert.equal(saved().profile.name, 'Jamie Tan')
      remount()
      assert.equal(balance(), 'S$ 0.00')
      assert.ok(screen.getByText('A clean slate'))
    })
    await t.test('existing v1 transactions and profile settings migrate without any loss', async () => {
      cleanup()
      const legacy = createEmptyState()
      delete legacy.initialBalance
      legacy.started = true
      legacy.profile = { ...legacy.profile, name: 'Taylor', email: 'taylor@example.test', budget: 175, currency: 'GBP', notifications: false, customPreference: 'keep' }
      legacy.transactions = [
        { id: 'legacy-income', type: 'income', category: 'freelance', amount: 100, description: 'Previous work', date: dateKey(), createdAt: 1 },
        { id: 'legacy-expense', type: 'expense', category: 'food', amount: 25.5, description: 'Existing lunch', date: dateKey(), createdAt: 2 },
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))
      remount()
      assert.equal(balance(), '£ 74.50')
      assert.equal(saved().initialBalance, null)
      assert.deepEqual(saved().transactions, legacy.transactions)
      assert.deepEqual(saved().profile, legacy.profile)
      await user.click(screen.getByRole('button', { name: /View Previous work/ }))
      await user.click(screen.getByRole('link', { name: 'Edit transaction' }))
      assert.equal(screen.getByRole('button', { name: 'Freelance', exact: true }).getAttribute('aria-pressed'), 'true')
      await user.click(screen.getByRole('button', { name: 'Save Changes' }))
      assert.deepEqual(saved().transactions, legacy.transactions)
    })
    await t.test('deep links and navigation use the project basename without changing saved data', async () => {
      const existing = saved()
      remount('/add?type=income')
      assert.ok(screen.getByRole('heading', { name: 'Add Income' }))
      assert.equal(screen.getAllByRole('link', { name: 'Home', exact: true })[0].getAttribute('href'), '/Spendly/home')
      remount('/edit/legacy-income')
      assert.ok(screen.getByRole('heading', { name: 'Edit Income' }))
      remount('/history')
      assert.ok(screen.getByRole('button', { name: /View Previous work/ }))
      assert.deepEqual(saved(), existing)
    })
    await t.test('malformed saved data is reported and never silently overwritten', async () => {
      cleanup()
      const unreadable = '{invalid json'
      localStorage.setItem(STORAGE_KEY, unreadable)
      remount()
      assert.ok(screen.getByRole('alert').textContent.includes('left unchanged'))
      assert.equal(localStorage.getItem(STORAGE_KEY), unreadable)
      assert.equal(balance(), 'RM 0.00')
      assert.equal(document.querySelectorAll('.transaction-row').length, 0)
    })
  } finally {
    cleanup()
    console.warn = originalConsoleWarn
    await server.close()
    dom.window.close()
    for (const [key, descriptor] of originalGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
    if (NativeResizeObserver) globalThis.ResizeObserver = NativeResizeObserver
    else delete globalThis.ResizeObserver
  }
})
