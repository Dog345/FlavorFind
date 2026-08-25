const STATUS_STYLES = {
  pending: 'bg-warning-50 text-warning-500',
  confirmed: 'bg-info-50 text-info-500',
  preparing: 'bg-brand-50 text-brand-600',
  ready: 'bg-purple-50 text-purple-500',
  served: 'bg-teal-50 text-teal-500',
  paid: 'bg-success-50 text-success-500',
  cancelled: 'bg-danger-50 text-danger-500',
  available: 'bg-success-50 text-success-500',
  occupied: 'bg-danger-50 text-danger-500',
  reserved: 'bg-warning-50 text-warning-500',
  unavailable: 'bg-ink-900/5 text-ink-400',
}

const LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  paid: 'Paid',
  cancelled: 'Cancelled',
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  unavailable: 'Unavailable',
}

export default function Badge({ status, children }) {
  const style = STATUS_STYLES[status] ?? 'bg-ink-900/5 text-ink-500'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {children ?? LABELS[status] ?? status}
    </span>
  )
}
