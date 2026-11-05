import { useEffect, useState } from 'react'
import { SpendlyContext } from './context'
import { createEmptyState, migrateState, STORAGE_KEY, toCents, fromCents, validateAmount, validateTransaction, getCategory } from './lib/finance'

function readSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = migrateState(JSON.parse(saved))
        if (data) return { data, issue: '', canPersist: true }
      } catch { /* Preserve unreadable data instead of replacing it. */ }
      return { data: createEmptyState(), issue: 'Your saved data could not be read and has been left unchanged. Changes in this session will not replace it.', canPersist: false }
    }
    return { data: createEmptyState(), issue: '', canPersist: true }
  } catch {
    return { data: createEmptyState(), issue: 'Local storage is unavailable. Your changes will last for this session only.', canPersist: false }
  }
}
export default function SpendlyProvider({ children }) {
  const [initial] = useState(readSavedState)
  const [data, setData] = useState(initial.data)
  const [storageIssue, setStorageIssue] = useState(initial.issue)
  const [toast, setToast] = useState('')
  useEffect(() => {
    if (!initial.canPersist) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
    catch { setStorageIssue('Your changes could not be saved on this device. Please free up browser storage.') }
  }, [data, initial.canPersist])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])
  function saveTransaction(transaction) {
    const error = validateTransaction(transaction)
    if (error) return error
    const item = { ...transaction, id: transaction.id || crypto.randomUUID(), amount: fromCents(toCents(transaction.amount)), description: transaction.description.trim() || getCategory(transaction.category).label, createdAt: transaction.createdAt || Date.now() }
    setData((previous) => ({ ...previous, transactions: transaction.id ? previous.transactions.map((row) => row.id === item.id ? item : row) : [...previous.transactions, item] }))
    setToast(transaction.id ? 'Transaction updated' : `${transaction.type === 'income' ? 'Income' : 'Expense'} added. Nicely tracked!`)
    return ''
  }
  const value = {
    ...data, toast, storageIssue,
    dismissToast: () => setToast(''),
    start: () => setData((previous) => ({ ...previous, started: true })),
    updateProfile: (updates) => {
      setData((previous) => ({ ...previous, profile: { ...previous.profile, ...updates } }))
      setToast('Preferences saved')
    },
    saveTransaction,
    setInitialBalance: (amount) => {
      const error = validateAmount(amount, { allowZero: true })
      if (error) return error
      const balance = fromCents(toCents(amount))
      // Replace one wallet value; never create an income or add to the old value.
      setData((previous) => previous.initialBalance === balance ? previous : { ...previous, initialBalance: balance })
      setToast('Initial balance saved')
      return ''
    },
    deleteTransaction: (id) => {
      setData((previous) => ({ ...previous, transactions: previous.transactions.filter((item) => item.id !== id) }))
      setToast('Transaction deleted')
    },
    clearTransactions: () => {
      setData((previous) => ({ ...previous, transactions: [], sampleData: false }))
      setToast('You’re all set for a fresh start')
    },
  }
  return <SpendlyContext.Provider value={value}>{children}</SpendlyContext.Provider>
}
