import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bell, ChevronRight, Plus, Sparkles, WalletCards } from 'lucide-react'
import { Avatar, EmptyState, FlowIcon, SectionHeading, TransactionDetails, TransactionRow } from '../components'
import { useSpendly } from '../context'
import InitialBalanceDialog from '../InitialBalanceDialog'
import { filterTransactions, getBudget, getTotals, getWalletTotals, money, monthKey, monthLabel } from '../lib/finance'

export default function Home() {
  const { profile, transactions, sampleData, initialBalance } = useSpendly()
  const [selected, setSelected] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showInitialBalance, setShowInitialBalance] = useState(false)
  const month = monthKey()
  const totals = getTotals(transactions, month)
  const wallet = getWalletTotals(transactions, initialBalance)
  const budget = getBudget(totals.expenses, profile.budget)
  const hasBudget = profile.budget > 0
  const hasInitialBalance = initialBalance !== null
  const recent = filterTransactions(transactions).slice(0, 4)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = profile.name.trim().split(' ')[0] || 'friend'
  const notification = !profile.notifications
    ? 'Budget reminders are turned off. You can enable them in Profile & Settings.'
    : !hasBudget
      ? 'Set a monthly budget in Profile & Settings to get a spending check-in.'
      : budget.remaining < 0
        ? `You’re ${money(Math.abs(budget.remaining), profile.currency)} over your monthly budget. Review your spending to get back on track.`
        : `You have ${money(budget.remaining, profile.currency)} left in this month’s budget. Keep taking those small steps!`

  return (
    <div className="home-page">
      <header className="home-header">
        <Link to="/profile" className="greeting-avatar"><Avatar /></Link>
        <div><h1>{greeting}, {firstName}<span className="greeting-wave">✦</span></h1><p>Let’s make every ringgit count.</p></div>
        <div className="notifications-wrap">
          <button type="button" className="icon-button notification-button" aria-label="Budget notifications" aria-expanded={showNotifications} onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={25} />{profile.notifications && <span className="notification-dot" />}
          </button>
          {showNotifications && <div className="notification-popover"><strong>Your little money check-in</strong><p>{notification}</p><Link to="/profile" onClick={() => setShowNotifications(false)}>Notification preferences <ChevronRight size={15} /></Link></div>}
        </div>
      </header>
      <div className="overview-label"><span>{monthLabel(month)} overview</span>{sampleData && <span className="sample-badge">Sample data</span>}</div>
      <div className="home-overview">
        <section className="balance-card" aria-label="Account balance">
          <div className="balance-label"><span>Total Balance</span><WalletCards size={25} /></div>
          <strong className="balance-amount" aria-live="polite">{money(wallet.balance, profile.currency)}</strong>
          <div className="balance-divider" />
          <div className="balance-flows">
            <div><FlowIcon income /><span><small>Income <span className="flow-period">this month</span></small><strong>{money(totals.income, profile.currency)}</strong></span></div>
            <div><FlowIcon /><span><small>Expenses <span className="flow-period">this month</span></small><strong>{money(totals.expenses, profile.currency)}</strong></span></div>
          </div>
        </section>
        <section className={`card budget-card ${hasBudget && budget.percentage > 100 ? 'over-budget' : ''}`}>
          <div className="section-heading"><h2>Monthly Budget</h2><span className="percentage-badge">{hasBudget ? `${budget.percentage}%` : 'Not set'}</span></div>
          {hasBudget ? <>
            <div className="budget-amount"><strong>{money(totals.expenses, profile.currency)}</strong><span>/ {money(profile.budget, profile.currency, profile.budget % 1 ? 2 : 0)}</span></div>
            <div className="progress-track" role="progressbar" aria-label="Monthly budget spent" aria-valuenow={Math.min(100, budget.percentage)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${budget.percentage}% of budget spent`}><span style={{ width: `${Math.min(100, budget.percentage)}%` }} /></div>
            <p className="budget-remaining"><strong>{money(Math.abs(budget.remaining), profile.currency)}</strong> {budget.remaining < 0 ? 'over budget' : 'remaining'}</p>
            <Link to="/profile" className="budget-link">Manage your budget <ChevronRight size={14} /></Link>
          </> : <div className="budget-setup"><p>Give your spending a little direction. Choose a monthly limit that works for you.</p><Link className="text-link" to="/profile">Set a monthly budget <ChevronRight size={15} /></Link></div>}
        </section>
      </div>
      <div className="wallet-actions" aria-label="Wallet actions">
        <Link to="/add?type=income" className="button add-money-button"><Plus size={21} aria-hidden="true" />Add Money</Link>
        <button type="button" className="button secondary initial-balance-button" onClick={() => setShowInitialBalance(true)}><WalletCards size={19} aria-hidden="true" />{hasInitialBalance ? 'Edit initial balance' : 'Set Initial Balance'}</button>
      </div>
      {hasInitialBalance && <p className="initial-balance-note">Initial balance: {money(initialBalance, profile.currency)} · Already included in Total Balance.</p>}
      <section className="recent-section">
        <SectionHeading title="Recent Transactions"><Link className="text-link" to="/history">View all <ArrowRight size={16} /></Link></SectionHeading>
        <div className="card transaction-list">{recent.length ? recent.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onClick={setSelected} />) : <EmptyState message="Add money or track an expense to start building your picture." />}</div>
      </section>
      <div className="home-bottom">
        <div className="insight-note"><span className="insight-symbol"><Sparkles size={21} /></span><div><strong>{budget.percentage >= 100 ? 'Time for a little check-in' : 'A little progress, every day'}</strong><p>{budget.percentage >= 100 ? 'Your budget is a guide. Review your spending and plan your next step.' : 'Track the little things. They add up to a clearer picture.'}</p></div></div>
        <Link to="/add" className="button home-add"><Plus size={20} /> Add transaction</Link>
      </div>
      {showInitialBalance && <InitialBalanceDialog onClose={() => setShowInitialBalance(false)} />}
      {selected && <TransactionDetails transaction={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
