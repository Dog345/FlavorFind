import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { formatKES, formatDateTime } from '../../lib/format'

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'served',
}

export default function OrderDetailDrawer({ order, open, onClose, onAdvanceStatus, onTakePayment, canManage }) {
  if (!order) return null
  const nextStatus = NEXT_STATUS[order.status]

  return (
    <Modal open={open} onClose={onClose} title={`Order ${order.order_number}`} size="lg">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge status={order.status} />
        <span className="text-sm text-ink-500">Table {order.table}</span>
        <span className="text-sm text-ink-400">·</span>
        <span className="text-sm text-ink-500">{order.waiter ?? 'Unassigned'}</span>
        <span className="ml-auto text-sm text-ink-400">{formatDateTime(order.created_at)}</span>
      </div>

      <div className="divide-y divide-surface-border rounded-xl border border-surface-border">
        {(order.items ?? []).map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4 p-3.5">
            <div className="min-w-0">
              <p className="font-semibold text-ink-900">
                {item.quantity}× {item.name}
              </p>
              {item.modifiers?.length > 0 && (
                <p className="mt-0.5 text-xs text-ink-400">{item.modifiers.join(', ')}</p>
              )}
              {item.notes && <p className="mt-0.5 text-xs italic text-brand-500">"{item.notes}"</p>}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Badge status={item.status} />
              <span className="text-sm font-semibold text-ink-900">
                {formatKES(item.unit_price * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-surface px-4 py-3">
        <span className="font-semibold text-ink-700">Total</span>
        <span className="text-lg font-bold text-ink-900">{formatKES(order.total)}</span>
      </div>

      {canManage && (
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {order.status === 'served' && (
            <Button variant="secondary" onClick={() => onTakePayment(order)}>
              Take payment
            </Button>
          )}
          {nextStatus && (
            <Button onClick={() => onAdvanceStatus(order, nextStatus)}>
              Mark as {nextStatus}
            </Button>
          )}
        </div>
      )}
    </Modal>
  )
}
