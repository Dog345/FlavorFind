import { Check } from 'lucide-react'
import LiveTimer from './LiveTimer'

const ITEM_NEXT = { pending: 'preparing', preparing: 'ready' }

export default function KitchenOrderCard({ order, onItemStatus, onMarkReady, markingReady }) {
  const allReady = order.items.every((i) => i.status === 'ready')

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-[#1c1f26] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-white">{order.order_number}</p>
          <p className="text-sm font-medium text-white/50">{order.table}</p>
        </div>
        <LiveTimer createdAt={order.created_at} />
      </div>

      <div className="flex-1 space-y-2">
        {order.items.map((item) => {
          const next = ITEM_NEXT[item.status]
          return (
            <div key={item.id} className="rounded-xl bg-white/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {item.quantity}× {item.name}
                  </p>
                  {item.modifiers?.length > 0 && (
                    <p className="mt-0.5 text-xs text-white/40">{item.modifiers.join(', ')}</p>
                  )}
                  {item.notes && <p className="mt-0.5 text-xs text-brand-300">"{item.notes}"</p>}
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/60">
                  {item.status}
                </span>
              </div>
              {next && (
                <button
                  onClick={() => onItemStatus(order.id, item.id, next)}
                  className="mt-2 w-full rounded-lg bg-brand-500 py-1.5 text-xs font-bold text-white hover:bg-brand-600"
                >
                  Mark {next}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button
        disabled={!allReady || markingReady}
        onClick={() => onMarkReady(order.id)}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-success-500 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
      >
        <Check className="h-4 w-4" />
        Mark order ready
      </button>
    </div>
  )
}
