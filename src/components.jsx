import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, CarFront, ChartNoAxesColumnIncreasing, Check, ChevronLeft, ChevronRight, Clapperboard, Coffee, Ellipsis, Gift, History, House, Laptop, Plus, ReceiptText, ShoppingBag, UserRound, WalletCards, X } from 'lucide-react'
import { useSpendly } from './context'
import { getCategory, money, monthLabel, shiftMonth, parseDate, dateKey } from './lib/finance'

const icons = { Coffee, ShoppingBag, CarFront, ReceiptText, Clapperboard, Ellipsis, BriefcaseBusiness, ArrowDownRight, Laptop, Gift }
export function CategoryIcon({ category, size = 24, ...props }) {
  const Icon = icons[getCategory(category).icon] || Ellipsis
  return <Icon size={size} strokeWidth={1.85} {...props} />
}
export function Brand({ large = false }) {
  return <Link className={`brand ${large ? 'brand-large' : ''}`} to="/home" aria-label="Spendly home"><span className="brand-icon"><WalletCards aria-hidden="true" /></span><span>Spendly<span className="brand-dot">.</span></span></Link>
}
export function Avatar({ large = false }) {
  const { profile } = useSpendly()
  const initials = profile.name.trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase() || 'S'
  return <span className={`avatar ${large ? 'avatar-large' : ''}`} aria-label={`${profile.name}'s avatar`}>{initials}</span>
}
const links = [
  { to: '/home', text: 'Home', icon: House },
  { to: '/history', text: 'History', icon: History },
  { to: '/add', text: 'Add', icon: Plus },
  { to: '/analytics', text: 'Analytics', icon: ChartNoAxesColumnIncreasing },
  { to: '/profile', text: 'Profile', icon: UserRound },
]
export function Layout() {
  const { pathname } = useLocation()
  const { toast, dismissToast, storageIssue, profile } = useSpendly()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.title = `${pathname.startsWith('/edit') ? 'Edit transaction' : links.find((link) => link.to === pathname)?.text || 'Home'} · Spendly`
  }, [pathname])
  return <div className="app-shell">
    <aside className="sidebar"><Brand /><div className="sidebar-caption">YOUR EVERYDAY MONEY COMPANION</div><nav className="desktop-nav" aria-label="Main navigation">{links.map(({ to, text, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `${isActive || (to === '/add' && pathname.startsWith('/edit/')) ? 'active' : ''}`}><Icon size={21} /><span>{text === 'Add' ? 'Add transaction' : text}</span>{text === 'Add' && <span className="nav-plus">+</span>}</NavLink>)}</nav><div className="sidebar-tip"><span className="tip-sparkle">✦</span><strong>Small steps.<br />Smarter spending.</strong><p>A little awareness goes a long way.</p></div><Link to="/profile" className="sidebar-profile"><Avatar /><span><strong>{profile.name}</strong><small>{profile.account}</small></span><ChevronRight size={18} /></Link></aside>
    <div className="workspace"><div className="desktop-topbar"><span>Your money, made simple.</span><span className="local-status"><span /> Saved on your device</span></div>{storageIssue && <div className="storage-warning" role="alert">{storageIssue}</div>}<main id="main-content"><Outlet /></main><footer className="desktop-footer">Made for your everyday. <span>Spendly · v1.0.0</span></footer></div>
    <nav className="bottom-nav" aria-label="Mobile navigation">{links.map(({ to, text, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `${isActive || (to === '/add' && pathname.startsWith('/edit/')) ? 'active' : ''} ${text === 'Add' ? 'add-nav' : ''}`}><span className="nav-icon"><Icon size={25} strokeWidth={1.9} /></span><span>{text}</span></NavLink>)}</nav>
    {toast && <div className="toast" role="status"><span className="toast-check"><Check size={17} /></span>{toast}<button type="button" onClick={dismissToast} aria-label="Dismiss notification"><X size={16} /></button></div>}
  </div>
}
export function PageHeader({ title, subtitle, action, back }) {
  return <header className={`page-header ${back ? 'with-back' : ''}`}>{back && <Link to="/home" className="icon-button back-button" aria-label="Back to home"><ChevronLeft size={27} /></Link>}<div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</header>
}
export function SectionHeading({ title, children }) {
  return <div className="section-heading"><h2>{title}</h2>{children}</div>
}
export function MonthPicker({ month, onChange }) {
  return <div className="month-picker"><button type="button" className="icon-button" aria-label="Previous month" onClick={() => onChange(shiftMonth(month, -1))}><ChevronLeft size={23} /></button><span aria-live="polite">{monthLabel(month)}</span><button type="button" className="icon-button" aria-label="Next month" onClick={() => onChange(shiftMonth(month, 1))}><ChevronRight size={23} /></button></div>
}
export function TransactionRow({ transaction, date = false, onClick }) {
  const { profile } = useSpendly()
  const category = getCategory(transaction.category)
  return <button type="button" className="transaction-row" onClick={() => onClick(transaction)} aria-label={`View ${transaction.description}, ${transaction.type}, ${money(transaction.amount, profile.currency)}`}><span className={`category-icon ${transaction.type === 'income' ? 'income-icon' : ''}`}><CategoryIcon category={transaction.category} /></span><span className="transaction-text"><strong>{transaction.description}</strong><small>{category.detail}{date && ` · ${parseDate(transaction.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}`}</small></span><strong className={`transaction-amount ${transaction.type === 'income' ? 'income-text' : ''}`}>{transaction.type === 'income' ? '+' : '−'}{money(transaction.amount, profile.currency)}</strong></button>
}
export function EmptyState({ title = 'A clean slate', message = 'Add your first transaction and start making every ringgit count.', filtered = false }) {
  return <div className="empty-state"><span className="empty-icon"><WalletCards size={30} /></span><h3>{title}</h3><p>{message}</p>{!filtered && <Link to="/add" className="button small-button"><Plus size={18} /> Add a transaction</Link>}</div>
}
export function Dialog({ title, onClose, children, className = '' }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} className={`dialog ${className}`} aria-labelledby={titleId} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="dialog-heading"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={21} /></button></div>{children}</dialog>
}
export function TransactionDetails({ transaction, onClose }) {
  const { profile, deleteTransaction } = useSpendly()
  const [confirming, setConfirming] = useState(false)
  return <Dialog title={confirming ? 'Delete transaction?' : 'Transaction details'} onClose={onClose}>{confirming ? <><p className="dialog-copy">Delete “{transaction.description}”? Your balance and budget will update automatically.</p><div className="dialog-actions"><button className="button secondary" onClick={() => setConfirming(false)}>Keep transaction</button><button className="button danger" onClick={() => { deleteTransaction(transaction.id); onClose() }}>Delete</button></div></> : <><div className="transaction-detail-hero"><span className="category-icon"><CategoryIcon category={transaction.category} size={29} /></span><h3>{transaction.description}</h3><strong className={transaction.type === 'income' ? 'income-text' : ''}>{transaction.type === 'income' ? '+' : '−'}{money(transaction.amount, profile.currency)}</strong></div><dl className="detail-list"><div><dt>Category</dt><dd>{getCategory(transaction.category).label}</dd></div><div><dt>Date</dt><dd>{parseDate(transaction.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div><div><dt>Type</dt><dd className="capitalize">{transaction.type}</dd></div></dl><div className="dialog-actions"><Link className="button" to={`/edit/${transaction.id}`}>Edit transaction</Link><button className="button danger-soft" onClick={() => setConfirming(true)}>Delete</button></div></>}</Dialog>
}
export function dayHeading(day) {
  const today = dateKey()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const prefix = day === today ? 'Today · ' : day === dateKey(yesterday) ? 'Yesterday · ' : ''
  return `${prefix}${parseDate(day).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`
}
export function FlowIcon({ income = false }) {
  return <span className={`flow-icon ${income ? '' : 'expense-flow'}`}>{income ? <ArrowDownRight size={23} /> : <ArrowUpRight size={23} />}</span>
}
