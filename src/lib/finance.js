export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food', detail: 'Food & Drinks', icon: 'Coffee', color: '#6C4DFF' },
  { id: 'shopping', label: 'Shopping', detail: 'Lifestyle', icon: 'ShoppingBag', color: '#4931B8' },
  { id: 'transport', label: 'Transport', detail: 'Transport', icon: 'CarFront', color: '#FFB58D' },
  { id: 'bills', label: 'Bills', detail: 'Bills & Utilities', icon: 'ReceiptText', color: '#A58BFF' },
  { id: 'entertainment', label: 'Entertainment', detail: 'Entertainment', icon: 'Clapperboard', color: '#C7B6FF' },
  { id: 'others', label: 'Others', detail: 'Others', icon: 'Ellipsis', color: '#DED7EF' },
]
export const INCOME_CATEGORIES = [
  { id: 'allowance', label: 'Allowance', detail: 'Income · Allowance', icon: 'ArrowDownRight' },
  { id: 'salary', label: 'Salary', detail: 'Income · Salary', icon: 'BriefcaseBusiness' },
  { id: 'part-time', label: 'Part-time Job', detail: 'Income · Part-time Job', icon: 'Laptop' },
  { id: 'gift', label: 'Gift', detail: 'Income · Gift', icon: 'Gift' },
  { id: 'other-income', label: 'Other', detail: 'Income · Other', icon: 'Ellipsis' },
]
// Retain the original category on saved records without offering it for new income.
export const LEGACY_INCOME_CATEGORIES = [
  { id: 'freelance', label: 'Freelance', detail: 'Income · Freelance', icon: 'Laptop' },
]
export const CURRENCIES = { MYR: 'RM', USD: '$', SGD: 'S$', GBP: '£', EUR: '€' }
export const STORAGE_KEY = 'spendly.v1'
export const MAX_AMOUNT = 999999999
export const toCents = (amount) => Math.round(Number(amount) * 100)
export const fromCents = (cents) => cents / 100
export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const monthKey = (date = new Date()) => dateKey(date).slice(0, 7)
export const parseDate = (value) => new Date(`${value}T12:00:00`)
export const monthLabel = (month, options = { month: 'long', year: 'numeric' }) => parseDate(`${month}-01`).toLocaleDateString('en-MY', options)
export function shiftMonth(month, offset) {
  const date = parseDate(`${month}-01`)
  date.setMonth(date.getMonth() + offset)
  return monthKey(date)
}
export function money(amount, currency = 'MYR', decimals = 2) {
  return `${CURRENCIES[currency] || 'RM'} ${Number(amount).toLocaleString('en-MY', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}
export function getCategory(id) {
  return [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...LEGACY_INCOME_CATEGORIES].find((category) => category.id === id) || EXPENSE_CATEGORIES[5]
}
export function getTotals(transactions, month) {
  const items = month ? transactions.filter((transaction) => transaction.date.startsWith(month)) : transactions
  const income = items.filter((item) => item.type === 'income').reduce((total, item) => total + toCents(item.amount), 0)
  const expenses = items.filter((item) => item.type === 'expense').reduce((total, item) => total + toCents(item.amount), 0)
  return { income: fromCents(income), expenses: fromCents(expenses), balance: fromCents(income - expenses) }
}
export function getWalletTotals(transactions, initialBalance = null) {
  const totals = getTotals(transactions)
  return { ...totals, balance: fromCents(toCents(initialBalance ?? 0) + toCents(totals.income) - toCents(totals.expenses)) }
}
export function cashFlowData(transactions, month) {
  return Array.from({ length: 6 }, (_, index) => {
    const key = shiftMonth(month, index - 5)
    const totals = getTotals(transactions, key)
    return { month: key, name: monthLabel(key, { month: 'short' }), income: totals.income, expenses: totals.expenses }
  })
}
export function getBudget(expenses, budget) {
  return { percentage: budget > 0 ? Math.round(toCents(expenses) / toCents(budget) * 100) : 0, remaining: fromCents(toCents(budget) - toCents(expenses)) }
}
export function filterTransactions(transactions, { month = '', type = 'all', category = 'all', search = '' } = {}) {
  const query = search.toLowerCase().trim()
  return transactions.filter((transaction) =>
    (!month || transaction.date.startsWith(month)) &&
    (type === 'all' || transaction.type === type) &&
    (category === 'all' || transaction.category === category) &&
    (!query || `${transaction.description} ${getCategory(transaction.category).detail} ${transaction.amount} ${transaction.date}`.toLowerCase().includes(query)),
  ).sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
}
export function categoryTotals(transactions, month) {
  return EXPENSE_CATEGORIES.map((category) => ({ ...category, value: fromCents(transactions.filter((item) => item.type === 'expense' && item.category === category.id && item.date.startsWith(month)).reduce((sum, item) => sum + toCents(item.amount), 0)) }))
}
export function validateAmount(amount, { allowZero = false } = {}) {
  if (!['string', 'number'].includes(typeof amount) || !/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(String(amount).trim()) || !Number.isFinite(Number(amount)) || Number(amount) > MAX_AMOUNT || Number(amount) < (allowZero ? 0 : 0.01)) {
    return `Enter an amount between ${allowZero ? '0' : '0.01'} and 999,999,999 with up to two decimal places.`
  }
  return ''
}
export function validateTransaction(transaction) {
  if (!transaction || typeof transaction !== 'object') return 'Enter a valid transaction.'
  const amountError = validateAmount(transaction.amount)
  if (amountError) return amountError
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date || '') || Number.isNaN(parseDate(transaction.date).getTime()) || dateKey(parseDate(transaction.date)) !== transaction.date) return 'Choose a valid date.'
  const categories = transaction.type === 'income' ? [...INCOME_CATEGORIES, ...LEGACY_INCOME_CATEGORIES] : transaction.type === 'expense' ? EXPENSE_CATEGORIES : []
  if (!categories.some((category) => category.id === transaction.category)) return 'Choose a category.'
  if (String(transaction.description || '').length > 120) return 'Keep your description under 120 characters.'
  return ''
}
export function createEmptyState() {
  return {
    version: 1, started: false, sampleData: false, initialBalance: null,
    profile: { name: 'You', email: '', account: 'Personal account', budget: 0, currency: 'MYR', notifications: true },
    transactions: [],
  }
}
export function migrateState(state) {
  if (!state || typeof state !== 'object') return null
  const migrated = { ...state, initialBalance: state.initialBalance === undefined ? null : state.initialBalance }
  return isValidState(migrated) ? migrated : null
}
export function isValidState(state) {
  return state?.version === 1 && typeof state.started === 'boolean' &&
    (state.initialBalance === null || (typeof state.initialBalance === 'number' && !validateAmount(state.initialBalance, { allowZero: true }))) &&
    typeof state.profile?.name === 'string' && typeof state.profile?.email === 'string' && typeof state.profile?.account === 'string' && Number.isFinite(state.profile?.budget) && state.profile.budget >= 0 && Object.hasOwn(CURRENCIES, state.profile.currency) && typeof state.profile.notifications === 'boolean' &&
    Array.isArray(state.transactions) && state.transactions.every((item) => item && typeof item.id === 'string' && typeof item.description === 'string' && typeof item.amount === 'number' && !validateTransaction(item))
}
