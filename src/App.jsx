import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SpendlyProvider from './SpendlyProvider'
import { useSpendly } from './context'
import { Layout } from './components'
import Welcome from './pages/Welcome'
import Home from './pages/Home'
import TransactionForm from './pages/TransactionForm'
import History from './pages/History'
import Profile from './pages/Profile'
import './App.css'

const Analytics = lazy(() => import('./pages/Analytics'))

function WelcomeRoute() {
  const { started } = useSpendly()
  return started ? <Navigate to="/home" replace /> : <Welcome />
}
export default function App() {
  return <SpendlyProvider><BrowserRouter basename={import.meta.env.BASE_URL}><a className="skip-link" href="#main-content">Skip to content</a><Routes><Route path="/" element={<WelcomeRoute />} /><Route path="/welcome" element={<Welcome />} /><Route element={<Layout />}><Route path="/home" element={<Home />} /><Route path="/add" element={<TransactionForm key="new" />} /><Route path="/edit/:id" element={<TransactionForm />} /><Route path="/history" element={<History />} /><Route path="/analytics" element={<Suspense fallback={<div className="empty-state" role="status">Putting your spending in perspective…</div>}><Analytics /></Suspense>} /><Route path="/profile" element={<Profile />} /><Route path="*" element={<Navigate to="/home" replace />} /></Route></Routes></BrowserRouter></SpendlyProvider>
}
