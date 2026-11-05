import { useRef, useState } from 'react'
import { Dialog } from './components'
import { useSpendly } from './context'
import { MAX_AMOUNT } from './lib/finance'

export default function InitialBalanceDialog({ onClose }) {
  const { initialBalance, profile, setInitialBalance } = useSpendly()
  const [amount, setAmount] = useState(initialBalance === null ? '' : initialBalance.toFixed(2))
  const [error, setError] = useState('')
  const submitting = useRef(false)
  const isEditing = initialBalance !== null

  function handleSubmit(event) {
    event.preventDefault()
    if (submitting.current) return
    const result = setInitialBalance(amount)
    if (result) { setError(result); return }
    submitting.current = true
    onClose()
  }

  return (
    <Dialog title={isEditing ? 'Edit Initial Balance' : 'Set Initial Balance'} onClose={onClose}>
      <p className="dialog-copy" id="initial-balance-help">
        {isEditing
          ? 'This replaces your starting balance. It does not add the amount again or change your transactions.'
          : 'Enter the money you already had before tracking transactions in Spendly. Only include money that is not already recorded as income.'}
        {' '}Your initial balance is included in your wallet, but never counted as monthly income.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="initial-balance">Initial balance ({profile.currency})</label>
          <input id="initial-balance" name="initialBalance" type="number" inputMode="decimal"
            min="0" max={MAX_AMOUNT} step="0.01" required autoFocus placeholder="0.00"
            value={amount} aria-describedby={error ? 'initial-balance-help initial-balance-error' : 'initial-balance-help'}
            aria-invalid={error ? true : undefined}
            onChange={(event) => { setAmount(event.target.value); setError('') }} />
        </div>
        {error && <p id="initial-balance-error" className="form-error" role="alert">{error}</p>}
        <button className="button full-width" type="submit">{isEditing ? 'Update initial balance' : 'Save initial balance'}</button>
      </form>
    </Dialog>
  )
}
