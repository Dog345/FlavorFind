import { useState } from 'react'
import { Banknote, Smartphone, Landmark } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { formatKES } from '../../lib/format'
import { usePayCash, usePayExternal, usePayMpesa, usePaymentStatusPoll } from './usePayments'

const METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
  { id: 'external', label: 'External', icon: Landmark },
]

export default function PaymentModal({ order, open, onClose }) {
  const [method, setMethod] = useState('cash')
  const [amountTendered, setAmountTendered] = useState('')
  const [phone, setPhone] = useState('')
  const [provider, setProvider] = useState('Equity')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [mpesaPaymentId, setMpesaPaymentId] = useState(null)

  const payCash = usePayCash(order?.id)
  const payExternal = usePayExternal(order?.id)
  const payMpesa = usePayMpesa(order?.id)
  const mpesaStatus = usePaymentStatusPoll(mpesaPaymentId, !!mpesaPaymentId)

  if (!order) return null

  const change = Math.max(0, Number(amountTendered || 0) - order.total)

  const handleClose = () => {
    setMethod('cash')
    setAmountTendered('')
    setPhone('')
    setReference('')
    setNotes('')
    setMpesaPaymentId(null)
    onClose()
  }

  const handleCash = () => {
    payCash.mutate(
      { amountTendered: Number(amountTendered), notes },
      { onSuccess: handleClose }
    )
  }

  const handleExternal = () => {
    payExternal.mutate(
      { amount: order.total, provider, reference, notes },
      { onSuccess: handleClose }
    )
  }

  const handleMpesa = () => {
    payMpesa.mutate(
      { phone },
      {
        onSuccess: (data) => setMpesaPaymentId(data?.payment_id ?? data?.id),
      }
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Take payment · ${order.order_number}`} size="sm">
      <div className="mb-4 flex items-center justify-between rounded-xl bg-surface px-4 py-3">
        <span className="text-sm font-medium text-ink-500">Amount due</span>
        <span className="text-lg font-bold text-ink-900">{formatKES(order.total)}</span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold ${
              method === m.id ? 'border-brand-400 bg-brand-50 text-brand-600' : 'border-surface-border text-ink-500'
            }`}
          >
            <m.icon className="h-5 w-5" />
            {m.label}
          </button>
        ))}
      </div>

      {method === 'cash' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Amount tendered</label>
            <input
              type="number"
              value={amountTendered}
              onChange={(e) => setAmountTendered(e.target.value)}
              placeholder="0.00"
              className="h-11 w-full rounded-xl border border-surface-border px-3 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          {Number(amountTendered) > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-success-50 px-4 py-2.5 text-sm">
              <span className="font-medium text-ink-700">Change</span>
              <span className="font-bold text-success-500">{formatKES(change)}</span>
            </div>
          )}
          <Button
            className="w-full"
            disabled={!amountTendered || Number(amountTendered) < order.total}
            loading={payCash.isPending}
            onClick={handleCash}
          >
            Confirm cash payment
          </Button>
        </div>
      )}

      {method === 'mpesa' && (
        <div className="space-y-3">
          {!mpesaPaymentId ? (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700">Customer phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="254712345678"
                  className="h-11 w-full rounded-xl border border-surface-border px-3 text-sm focus:border-brand-400 focus:outline-none"
                />
              </div>
              <Button className="w-full" disabled={!phone} loading={payMpesa.isPending} onClick={handleMpesa}>
                Send STK push
              </Button>
            </>
          ) : (
            <div className="rounded-xl border border-surface-border p-4 text-center">
              <p className="text-sm font-semibold text-ink-900">
                {mpesaStatus.data?.status === 'completed'
                  ? 'Payment received'
                  : mpesaStatus.data?.status === 'failed'
                  ? 'Payment failed'
                  : mpesaStatus.data?.status === 'timeout'
                  ? 'Prompt timed out'
                  : 'Waiting for customer to complete payment...'}
              </p>
              <p className="mt-1 text-xs text-ink-400">Checking status automatically</p>
              {['completed', 'failed', 'timeout'].includes(mpesaStatus.data?.status) && (
                <Button className="mt-3 w-full" variant="secondary" onClick={handleClose}>
                  Close
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {method === 'external' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Provider</label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="h-11 w-full rounded-xl border border-surface-border px-3 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="TXN123"
              className="h-11 w-full rounded-xl border border-surface-border px-3 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
          <Button className="w-full" disabled={!reference} loading={payExternal.isPending} onClick={handleExternal}>
            Confirm payment
          </Button>
        </div>
      )}

      <div className="mt-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
      </div>
    </Modal>
  )
}
