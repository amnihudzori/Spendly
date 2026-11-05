import test from 'node:test'
import assert from 'node:assert/strict'
import { cashFlowData, categoryTotals, createEmptyState, dateKey, filterTransactions, getBudget, getCategory, getTotals, getWalletTotals, INCOME_CATEGORIES, isValidState, migrateState, money, shiftMonth, validateAmount, validateTransaction } from '../src/lib/finance.js'

const transactions = [
  { id: 'allowance', type: 'income', category: 'allowance', amount: 200, date: '2026-11-01', description: 'Weekly allowance', createdAt: 1 },
  { id: 'coffee', type: 'expense', category: 'food', amount: 25.5, date: '2026-11-05', description: 'Coffee', createdAt: 2 },
  { id: 'old-job', type: 'income', category: 'freelance', amount: 100, date: '2026-10-05', description: 'Previous work', createdAt: 0 },
]

test('new users have no transactions, initial money, or preset budget', () => {
  const state = createEmptyState()
  assert.equal(state.initialBalance, null)
  assert.deepEqual(state.transactions, [])
  assert.equal(state.profile.budget, 0)
  assert.equal(state.sampleData, false)
  assert.deepEqual(getWalletTotals(state.transactions, state.initialBalance), { income: 0, expenses: 0, balance: 0 })
  assert.equal(isValidState(state), true)
})
test('wallet balance is initial balance plus all income minus all expenses', () => {
  assert.deepEqual(getWalletTotals(transactions, 500), { income: 300, expenses: 25.5, balance: 774.5 })
  assert.equal(getWalletTotals(transactions).balance, 274.5)
  assert.equal(getWalletTotals(transactions, 0).balance, 274.5)
})
test('initial balance never changes earned monthly income, expenses, or cash flow', () => {
  assert.deepEqual(getTotals(transactions, '2026-11'), { income: 200, expenses: 25.5, balance: 174.5 })
  assert.equal(cashFlowData(transactions, '2026-11').at(-1).income, 200)
  assert.equal(cashFlowData(transactions, '2026-11').at(-1).expenses, 25.5)
})
test('cent-based arithmetic stays exact for fractional amounts', () => {
  const rows = [{ type: 'income', amount: 0.1 }, { type: 'income', amount: 0.2 }, { type: 'expense', amount: 0.1 }]
  assert.deepEqual(getWalletTotals(rows, 0.1), { income: 0.3, expenses: 0.1, balance: 0.3 })
})
test('income edits and deletions change wallet totals without changing expenses', () => {
  const updated = transactions.map((item) => item.id === 'allowance' ? { ...item, amount: 250 } : item)
  assert.equal(getWalletTotals(updated, 500).balance, 824.5)
  assert.equal(getWalletTotals(updated.filter((item) => item.id !== 'allowance'), 500).balance, 574.5)
  assert.equal(getTotals(updated, '2026-11').expenses, 25.5)
})
test('new income categories match the requested sources, retaining legacy lookups', () => {
  assert.deepEqual(INCOME_CATEGORIES.map((item) => item.label), ['Allowance', 'Salary', 'Part-time Job', 'Gift', 'Other'])
  assert.equal(getCategory('freelance').label, 'Freelance')
  assert.equal(validateTransaction(transactions[2]), '')
})
test('legacy v1 data gains only an unset initial balance and retains every saved field', () => {
  const { initialBalance: _unused, ...legacy } = createEmptyState()
  legacy.transactions = structuredClone(transactions)
  legacy.profile = { ...legacy.profile, name: 'Taylor', budget: 175, currency: 'GBP', customPreference: 'keep' }
  legacy.extraMetadata = { retained: true }
  const original = structuredClone(legacy)
  const migrated = migrateState(legacy)
  assert.equal(migrated.initialBalance, null)
  assert.deepEqual(migrated.transactions, original.transactions)
  assert.deepEqual(migrated.profile, original.profile)
  assert.deepEqual(migrated.extraMetadata, original.extraMetadata)
  assert.deepEqual(legacy, original)
  assert.deepEqual(migrateState(migrated), migrated)
})
test('a saved initial balance, including zero, survives migration', () => {
  for (const initialBalance of [0, 123.45]) {
    const state = { ...createEmptyState(), initialBalance, transactions }
    assert.deepEqual(migrateState(state), state)
  }
})
test('money validation rejects empty, negative, nonnumeric, and overprecision amounts', () => {
  for (const amount of ['', '  ', null, undefined, true, false, 'abc', '1e2', NaN, Infinity, -1, '-0.01', 0.001, '1.005', 1000000000]) {
    assert.notEqual(validateAmount(amount), '', String(amount))
    assert.notEqual(validateAmount(amount, { allowZero: true }), '', String(amount))
  }
  assert.notEqual(validateAmount(0), '')
  assert.equal(validateAmount(0, { allowZero: true }), '')
  assert.equal(validateAmount('123.45'), '')
  assert.equal(validateAmount('.50'), '')
})
test('transactions require a valid amount, source, type, and calendar date', () => {
  const valid = transactions[0]
  assert.equal(validateTransaction(valid), '')
  for (const changes of [{ amount: '' }, { amount: 0 }, { category: '' }, { category: 'food' }, { date: '' }, { date: '2026-02-30' }, { type: 'other' }]) {
    assert.notEqual(validateTransaction({ ...valid, ...changes }), '')
  }
  assert.notEqual(validateTransaction(null), '')
})
test('budgets depend only on expenses, including overspending', () => {
  assert.deepEqual(getBudget(getTotals(transactions, '2026-11').expenses, 100), { percentage: 26, remaining: 74.5 })
  assert.deepEqual(getBudget(550, 200), { percentage: 275, remaining: -350 })
})
test('expense categories exclude income', () => {
  const categories = categoryTotals(transactions, '2026-11')
  assert.equal(categories.find((item) => item.id === 'food').value, 25.5)
  assert.equal(categories.reduce((sum, item) => sum + item.value, 0), 25.5)
})
test('history combines search, type, month, and source filters without mutating records', () => {
  const original = structuredClone(transactions)
  const result = filterTransactions(transactions, { month: '2026-11', type: 'income', category: 'allowance', search: 'WEEKLY' })
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 'allowance')
  assert.equal(filterTransactions(transactions)[0].id, 'coffee')
  assert.equal(filterTransactions(transactions, { month: '2027-01' }).length, 0)
  assert.deepEqual(transactions, original)
})
test('six-month analytics includes actual income, expenses, and genuinely empty months', () => {
  const data = cashFlowData(transactions, '2026-11')
  assert.equal(data.length, 6)
  assert.equal(data[0].month, '2026-06')
  assert.equal(data[0].income, 0)
  assert.equal(data[0].expenses, 0)
  assert.equal(data[4].income, 100)
  assert.equal(data[5].income, 200)
  assert.equal(data[5].expenses, 25.5)
})
test('month navigation and date keys work across year boundaries', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12')
  assert.equal(shiftMonth('2026-12', 1), '2027-01')
  assert.equal(dateKey(new Date(2026, 0, 5)), '2026-01-05')
})
test('invalid saved records or initial balances are rejected safely', () => {
  assert.equal(migrateState(null), null)
  assert.equal(migrateState({ ...createEmptyState(), transactions: [null] }), null)
  assert.equal(migrateState({ ...createEmptyState(), initialBalance: -10 }), null)
  assert.equal(migrateState({ ...createEmptyState(), initialBalance: '100' }), null)
})
test('currency formatting preserves cents', () => {
  assert.equal(money(774.5), 'RM 774.50')
  assert.equal(money(774.5, 'SGD'), 'S$ 774.50')
})
