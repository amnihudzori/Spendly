import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Brand } from '../components'
import { useSpendly } from '../context'

function WalletIllustration() {
  return <svg className="wallet-illustration" viewBox="0 0 360 360" role="img" aria-label="A purple wallet with a Malaysian ringgit banknote"><circle cx="180" cy="180" r="163" fill="#D8CBFF" /><circle cx="42" cy="83" r="14.5" fill="#FFB58D" /><circle cx="315" cy="261" r="7" fill="#B29BFF" /><g transform="rotate(-9 180 155)"><rect x="106" y="62" width="168" height="114" rx="26" fill="#A58BFF" /><rect x="122" y="77" width="136" height="82" rx="15" fill="white" /><circle cx="190" cy="119" r="31.5" fill="#6C4DFF" /><text x="190" y="130" textAnchor="middle" fill="white" fontSize="27" fontWeight="750" fontFamily="sans-serif">RM</text></g><rect x="56" y="156" width="236" height="119" rx="26" fill="#4931B8" /><rect x="56" y="156" width="236" height="32" rx="16" fill="#6C4DFF" /><rect x="211" y="199" width="107" height="55" rx="26" fill="#FFB58D" /><circle cx="241" cy="226.5" r="9" fill="white" /><path d="M300 88v16m-8-8h16" stroke="#A58BFF" strokeWidth="3" strokeLinecap="round" /></svg>
}
export default function Welcome() {
  const { start } = useSpendly()
  const navigate = useNavigate()
  useEffect(() => { document.title = 'Spendly · Your money, made simple.' }, [])
  return <main className="welcome-page" id="main-content"><div className="welcome-brand"><Brand large /><p>Your money, made simple.</p></div><div className="welcome-art"><WalletIllustration /></div><div className="welcome-copy"><span className="eyebrow">A LITTLE CLARITY. A LOT MORE CONTROL.</span><h1>Your Money,<br className="desktop-break" /> Your Rules.</h1><p>Track your spending, stay on budget, and make every ringgit count.</p><button className="button welcome-cta" onClick={() => { start(); navigate('/home') }}>Get Started <ArrowRight size={25} /></button><p className="welcome-footnote">Small steps. Smarter spending.</p><span className="privacy-note"><ShieldCheck size={15} /> Just you and your money. No account needed.</span></div></main>
}
