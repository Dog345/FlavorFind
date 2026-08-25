import { Search } from 'lucide-react'

const STATUSES = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled']

export default function OrdersFilters({ filters, onChange }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onChange({ ...filters, status: s })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filters.status === s ? 'bg-brand-500 text-white' : 'bg-white text-ink-500 border border-surface-border hover:bg-surface'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          className="h-9 rounded-xl border border-surface-border bg-white px-3 text-sm text-ink-700 focus:border-brand-400 focus:outline-none"
        />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Table..."
            value={filters.table ?? ''}
            onChange={(e) => onChange({ ...filters, table: e.target.value })}
            className="h-9 w-32 rounded-xl border border-surface-border bg-white pl-8 pr-3 text-sm text-ink-700 focus:border-brand-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
