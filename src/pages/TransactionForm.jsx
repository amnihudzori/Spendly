import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, CalendarDays, Check, ShieldCheck } from 'lucide-react'
import { CategoryIcon, PageHeader } from '../components'
import { useSpendly } from '../context'
import { CURRENCIES, dateKey, EXPENSE_CATEGORIES, INCOME_CATEGORIES, LEGACY_INCOME_CATEGORIES, MAX_AMOUNT } from '../lib/finance'

function Editor({ existing, initialType }) {
  const { profile, saveTransaction } = useSpendly()
  const navigate = useNavigate()
  const [type, setType] = useState(existing?.type || initialType)
  const [amount, setAmount] = useState(existing?.amount?.toFixed(2) || '')
  const [category, setCategory] = useState(existing?.category || '')
  const [date, setDate] = useState(existing?.date || dateKey())
  const [description, setDescription] = useState(existing?.description || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : [...INCOME_CATEGORIES, ...LEGACY_INCOME_CATEGORIES.filter((item) => item.id === existing?.category)]
  const typeLabel = type === 'expense' ? 'Expense' : 'Income'
  function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    const result = saveTransaction({ ...existing, type, amount, category, date, description })
    if (result) { setError(result); return }
    setSaving(true)
    navigate(existing ? '/history' : '/home')
  }
  return <div className="form-page"><PageHeader title={`${existing ? 'Edit' : 'Add'} ${typeLabel}`} subtitle={existing ? 'A small update. A clearer picture.' : 'The little things add up. Let’s track them.'} back /><form onSubmit={handleSubmit} className="transaction-form"><div className="segmented-control type-control" aria-label="Transaction type">{['expense', 'income'].map((value) => <button key={value} type="button" className={type === value ? 'selected' : ''} aria-pressed={type === value} onClick={() => { setType(value); setCategory(''); setError('') }}>{value === 'expense' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}{value === 'expense' ? 'Expense' : 'Income'}</button>)}</div>
    <div className="amount-card card"><label htmlFor="amount">Amount</label><div className="amount-input-wrap"><span>{CURRENCIES[profile.currency]}</span><input id="amount" name="amount" type="number" inputMode="decimal" placeholder="0.00" min="0.01" max={MAX_AMOUNT} step="0.01" required value={amount} onChange={(event) => { setAmount(event.target.value); setError('') }} aria-describedby={error ? 'transaction-error' : undefined} aria-invalid={error ? true : undefined} /><small>{profile.currency}</small></div></div>
    <fieldset className="category-fieldset"><legend>{type === 'income' ? 'Source / Category' : 'Category'} <span className="required-marker">*</span></legend><div className="category-grid">{categories.map((item) => <button type="button" key={item.id} className={`category-option ${category === item.id ? 'selected' : ''}`} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setError('') }}><CategoryIcon category={item.id} size={27} /><span>{item.label}</span>{category === item.id && <Check className="category-check" size={13} />}</button>)}</div></fieldset>
    <div className="form-field"><label htmlFor="transaction-date">Date</label><div className="date-input-wrap"><CalendarDays size={23} /><input id="transaction-date" name="date" type="date" min="1900-01-01" max="9999-12-31" required value={date} onChange={(event) => setDate(event.target.value)} /></div></div>
    <div className="form-field"><label htmlFor="description">Description <span>Optional</span></label><input id="description" name="description" type="text" maxLength={120} placeholder={type === 'expense' ? 'What was it for?' : 'Where did it come from?'} value={description} onChange={(event) => setDescription(event.target.value)} /></div>
    {error && <p className="form-error" id="transaction-error" role="alert">{error}</p>}<button type="submit" className="button save-button" disabled={saving}>{saving ? 'Saving…' : existing ? 'Save Changes' : `Save ${typeLabel}`}<Check size={20} /></button><p className="form-hint">Amount, category, and date are required.</p><div className="form-privacy"><ShieldCheck size={15} /> Saved privately on your device</div></form></div>
}
export default function TransactionForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') === 'income' ? 'income' : 'expense'
  const { transactions } = useSpendly()
  const existing = id ? transactions.find((transaction) => transaction.id === id) : null
  if (id && !existing) return <div className="empty-state"><h1>Transaction not found</h1><p>It may have already been deleted.</p><Link className="button" to="/history">Back to history</Link></div>
  return <Editor key={id || `new-${initialType}`} existing={existing} initialType={initialType} />
}
