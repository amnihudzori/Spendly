import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { dayHeading, EmptyState, MonthPicker, PageHeader, TransactionDetails, TransactionRow } from '../components'
import { useSpendly } from '../context'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, LEGACY_INCOME_CATEGORIES, filterTransactions, getTotals, money, monthKey, monthLabel } from '../lib/finance'

export default function History() {
  const { transactions, profile } = useSpendly()
  const [month, setMonth] = useState(monthKey())
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const filtered = filterTransactions(transactions, { month, type, category, search })
  const totals = getTotals(transactions, month)
  const groups = new Map()
  filtered.forEach((transaction) => groups.set(transaction.date, [...(groups.get(transaction.date) || []), transaction]))
  const incomeCategories = [...INCOME_CATEGORIES, ...LEGACY_INCOME_CATEGORIES.filter((category) => transactions.some((item) => item.category === category.id))]
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : type === 'income' ? incomeCategories : [...EXPENSE_CATEGORIES, ...incomeCategories]
  const activeFilters = search || category !== 'all' || type !== 'all'
  return <div className="history-page"><PageHeader title="Transactions" subtitle="Your money, all in one place." action={<Link className="button small-button header-add" to="/add"><Plus size={18} /> Add new</Link>} /><div className="history-toolbar"><div className="search-field"><Search size={22} /><input type="search" aria-label="Search transactions" placeholder="Search transactions" value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button className="icon-button" type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={17} /></button>}</div><button type="button" className={`filter-toggle icon-button ${showFilters || category !== 'all' ? 'is-active' : ''}`} aria-label="Filter by category" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={21} />{category !== 'all' && <span className="notification-dot" />}</button></div>
    <div className="history-controls"><div className="segmented-control history-tabs" aria-label="Filter transaction type">{['all', 'income', 'expense'].map((value) => <button type="button" key={value} aria-pressed={type === value} className={type === value ? 'selected' : ''} onClick={() => { setType(value); setCategory('all') }}>{value === 'all' ? 'All' : value === 'income' ? 'Income' : 'Expenses'}</button>)}</div><MonthPicker month={month} onChange={setMonth} /></div>
    {showFilters && <div className="category-filter"><label htmlFor="category-filter">Category</label><select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.detail}</option>)}</select></div>}
    <div className="history-summary"><div><span>Income · {monthLabel(month, { month: 'long' })}</span><strong>+{money(totals.income, profile.currency)}</strong></div><div><span>Expenses · {monthLabel(month, { month: 'long' })}</span><strong>−{money(totals.expenses, profile.currency)}</strong></div></div>
    <div className="results-info"><span>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}{activeFilters ? ' found' : ''}</span>{activeFilters && <button type="button" className="text-link" onClick={() => { setSearch(''); setCategory('all'); setType('all') }}>Clear filters <X size={13} /></button>}</div>
    {filtered.length ? [...groups].map(([day, items]) => <section className="transaction-day" key={day}><h2>{dayHeading(day)}</h2><div className="card transaction-list">{items.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} date onClick={setSelected} />)}</div></section>) : <div className="card"><EmptyState title={activeFilters ? 'No matching transactions' : 'Nothing here just yet'} message={activeFilters ? 'Try another search or clear your filters.' : 'Add a transaction for this month, or browse another month.'} filtered={!!activeFilters} /></div>}
    <p className="list-footnote">Tap any transaction to view, edit, or delete it.</p>{selected && <TransactionDetails transaction={selected} onClose={() => setSelected(null)} />}</div>
}
