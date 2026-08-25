import Skeleton from '../../components/ui/Skeleton'

export default function KpiCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <p className="truncate text-xl font-bold text-ink-900">{value}</p>
        )}
        <p className="mt-0.5 truncate text-sm text-ink-400">{label}</p>
      </div>
    </div>
  )
}
