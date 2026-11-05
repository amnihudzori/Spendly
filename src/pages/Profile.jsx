import { useState } from 'react'
import { Bell, ChevronRight, CircleDollarSign, CircleHelp, Download, Heart, Pencil, ShieldCheck, Trash2, WalletCards } from 'lucide-react'
import { Avatar, Dialog, PageHeader, SectionHeading } from '../components'
import { useSpendly } from '../context'
import InitialBalanceDialog from '../InitialBalanceDialog'
import { CURRENCIES, dateKey, getCategory, money } from '../lib/finance'

function ProfileEditor({ onClose }) {
  const { profile, updateProfile } = useSpendly()
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [account, setAccount] = useState(profile.account)
  return <Dialog title="Make yourself at home" onClose={onClose}><p className="dialog-copy">A few details to make Spendly feel like you.</p><form onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; updateProfile({ name: name.trim(), email: email.trim(), account }); onClose() }}><div className="form-field"><label htmlFor="profile-name">Name</label><input id="profile-name" autoComplete="name" required maxLength={40} pattern=".*\S.*" value={name} onChange={(event) => setName(event.target.value)} /></div><div className="form-field"><label htmlFor="profile-email">Email <span>Optional</span></label><input id="profile-email" type="email" autoComplete="email" maxLength={100} value={email} onChange={(event) => setEmail(event.target.value)} /></div><div className="form-field"><label htmlFor="account-type">Profile type</label><select id="account-type" value={account} onChange={(event) => setAccount(event.target.value)}><option>Student account</option><option>Personal account</option><option>Freelancer account</option></select></div><button type="submit" className="button full-width">Save profile</button></form></Dialog>
}
function BudgetEditor({ onClose }) {
  const { profile, updateProfile } = useSpendly()
  const [budget, setBudget] = useState(profile.budget || '')
  return <Dialog title="Your monthly budget" onClose={onClose}><p className="dialog-copy">Set a spending limit that works for your everyday. You can adjust it anytime.</p><form onSubmit={(event) => { event.preventDefault(); updateProfile({ budget: Math.round(Number(budget) * 100) / 100 }); onClose() }}><div className="form-field"><label htmlFor="monthly-budget">Monthly spending limit ({profile.currency})</label><input id="monthly-budget" type="number" inputMode="decimal" min="0.01" max="999999999" step="0.01" required value={budget} onChange={(event) => setBudget(event.target.value)} /></div><button className="button full-width" type="submit">Save budget</button></form></Dialog>
}
function CurrencyEditor({ onClose }) {
  const { profile, updateProfile } = useSpendly()
  const [currency, setCurrency] = useState(profile.currency)
  return <Dialog title="Display currency" onClose={onClose}><p className="dialog-copy">Choose the symbol used throughout Spendly. Existing amounts stay the same; this doesn’t convert exchange rates.</p><form onSubmit={(event) => { event.preventDefault(); updateProfile({ currency }); onClose() }}><div className="form-field"><label htmlFor="currency">Currency</label><select id="currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>{Object.entries(CURRENCIES).map(([code, symbol]) => <option key={code} value={code}>{code} ({symbol})</option>)}</select></div><button type="submit" className="button full-width">Save currency</button></form></Dialog>
}
export default function Profile() {
  const { profile, updateProfile, transactions, clearTransactions, sampleData, initialBalance } = useSpendly()
  const [modal, setModal] = useState(null)
  function exportData() {
    const safeCell = (value) => {
      const text = String(value)
      return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`
    }
    const rows = [['Date', 'Description', 'Type', 'Category', 'Amount', 'Currency'], ...transactions.map((item) => [item.date, item.description, item.type, getCategory(item.category).label, item.amount.toFixed(2), profile.currency])]
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map((row) => row.map(safeCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `spendly-transactions-${dateKey()}.csv`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <div className="profile-page"><PageHeader title="Profile & Settings" subtitle="Make Spendly work for you." /><section className="card profile-card"><Avatar large /><div><h2>{profile.name}</h2><p>{profile.account}</p></div><button className="icon-button edit-profile-button" aria-label="Edit profile" onClick={() => setModal('profile')}><Pencil size={23} /></button></section>
    <div className="profile-columns"><section><SectionHeading title="Profile details" /><div className="card profile-details"><button className="detail-edit-row" type="button" onClick={() => setModal('profile')}><span><small>Name</small><strong>{profile.name}</strong></span><Pencil size={20} /></button><button className="detail-edit-row" type="button" onClick={() => setModal('profile')}><span><small>Email</small><strong>{profile.email || 'Add your email'}</strong></span><Pencil size={20} /></button></div></section>
    <section><SectionHeading title="Preferences" /><div className="card preferences"><button type="button" className="preference-row" onClick={() => setModal('budget')}><WalletCards size={25} /><span><strong>Monthly budget</strong><small>Your monthly spending limit</small></span><span className="preference-value">{money(profile.budget, profile.currency, profile.budget % 1 ? 2 : 0)}</span><ChevronRight size={20} /></button><div className="preference-row"><Bell size={25} /><span><strong>Notifications</strong><small>Budget reminders {profile.notifications ? 'on' : 'off'}</small></span><button type="button" role="switch" aria-checked={profile.notifications} aria-label="Budget reminders" className={`toggle ${profile.notifications ? 'on' : ''}`} onClick={() => updateProfile({ notifications: !profile.notifications })}><span /></button></div><button type="button" className="preference-row" onClick={() => setModal('currency')}><CircleDollarSign size={25} /><span><strong>Currency</strong></span><span className="preference-value muted">{profile.currency} ({CURRENCIES[profile.currency]})</span><ChevronRight size={20} /></button></div></section></div>
    <div className="card support-card"><button className="preference-row" onClick={() => setModal('help')}><CircleHelp size={25} /><span><strong>Help & Support</strong></span><ChevronRight size={20} /></button></div>
    <section className="data-section"><SectionHeading title="Your data" /><div className="card data-card"><button className="preference-row" onClick={exportData} disabled={!transactions.length}><Download size={22} /><span><strong>Export transactions</strong><small>Take a copy with you as a CSV file</small></span><ChevronRight size={20} /></button><button className="preference-row clear-data-button" onClick={() => setModal('clear')} disabled={!transactions.length}><Trash2 size={22} /><span><strong>{sampleData ? 'Clear data & start fresh' : 'Clear all transactions'}</strong><small>{sampleData ? 'Remove the sample transactions when you’re ready' : 'Keep your profile and preferences'}</small></span><ChevronRight size={20} /></button></div></section>
    <section className="app-info"><div><strong>App information</strong><span>v1.0.0</span></div><p>Spendly · Your money, made simple.</p></section><p className="profile-privacy"><ShieldCheck size={15} /> Your data stays in this browser, on this device.</p>
    <section className="card opening-balance-setting"><button type="button" className="preference-row" onClick={() => setModal('initial')}><WalletCards size={25} /><span><strong>Initial balance</strong><small>{initialBalance === null ? 'Money you had before using Spendly' : 'Included in your wallet, excluded from income'}</small></span><span className="preference-value">{initialBalance === null ? 'Set up' : money(initialBalance, profile.currency)}</span><ChevronRight size={20} /></button></section>
    {modal === 'profile' && <ProfileEditor onClose={() => setModal(null)} />}{modal === 'budget' && <BudgetEditor onClose={() => setModal(null)} />}{modal === 'currency' && <CurrencyEditor onClose={() => setModal(null)} />}{modal === 'initial' && <InitialBalanceDialog onClose={() => setModal(null)} />}
    {modal === 'clear' && <Dialog title="Ready for a fresh start?" onClose={() => setModal(null)}><p className="dialog-copy">This will permanently remove all {transactions.length} transactions from this browser. Your initial balance, profile, and budget will stay. Export a copy first if you’d like to keep them.</p><div className="dialog-actions"><button className="button secondary" onClick={() => setModal(null)}>Keep my data</button><button className="button danger" onClick={() => { clearTransactions(); setModal(null) }}>Clear transactions</button></div></Dialog>}
    {modal === 'help' && <Dialog title="A little help goes a long way" onClose={() => setModal(null)}><div className="help-content"><div className="help-intro"><Heart size={25} /><p>Spendly helps you build a clearer picture of your everyday money.</p></div><h3>How do I add money?</h3><p>Tap Add Money on Home, choose the source, and enter an amount and date. Income increases your wallet balance. Expenses decrease it.</p><h3>How does my starting balance work?</h3><p>Set Initial Balance records money you had before tracking transactions. Your wallet equals initial balance plus all income minus all expenses. Editing the initial balance replaces it; it never adds it again or counts it as earned income.</p><h3>Can I change a transaction?</h3><p>Tap any transaction in Home or History, then choose Edit or Delete.</p><h3>How do reminders work?</h3><p>Enable budget reminders in Preferences, then tap the bell on Home for a budget check-in. Reminders appear inside Spendly.</p><h3>Where is my data saved?</h3><p>Everything is stored in this browser using localStorage. Export a CSV to keep a copy. Clearing browser data removes your Spendly records.</p></div></Dialog>}
  </div>
}
