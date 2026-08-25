import { Users, Clock } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { timeAgo } from '../../lib/format'

export default function TableCard({ table, onOpenSession, onViewOrders, onCloseSession, onMarkArrived }) {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold text-ink-900">{table.label}</p>
          <p className="flex items-center gap-1 text-xs text-ink-400">
            <Users className="h-3 w-3" /> {table.capacity} pax
          </p>
        </div>
        <Badge status={table.status} />
      </div>

      {table.status === 'occupied' && table.session && (
        <div className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2 text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo(table.session.opened_at)}
          </span>
          <span>·</span>
          <span>{table.session.covers} covers</span>
        </div>
      )}

      <div className="mt-auto flex gap-2">
        {table.status === 'available' && (
          <button
            onClick={() => onOpenSession(table)}
            className="w-full rounded-xl bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Open session
          </button>
        )}
        {table.status === 'occupied' && (
          <>
            <button
              onClick={() => onViewOrders(table)}
              className="flex-1 rounded-xl border border-surface-border py-2 text-xs font-semibold text-ink-700 hover:bg-surface"
            >
              View orders
            </button>
            <button
              onClick={() => onCloseSession(table)}
              className="flex-1 rounded-xl border border-danger-500/30 py-2 text-xs font-semibold text-danger-500 hover:bg-danger-50"
            >
              Close session
            </button>
          </>
        )}
        {table.status === 'reserved' && (
          <button
            onClick={() => onMarkArrived(table)}
            className="w-full rounded-xl bg-warning-500 py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            Mark arrived
          </button>
        )}
        {table.status === 'unavailable' && (
          <div className="w-full rounded-xl bg-surface py-2 text-center text-xs font-semibold text-ink-400">
            Unavailable
          </div>
        )}
      </div>
    </div>
  )
}
