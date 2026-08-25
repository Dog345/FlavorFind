import { format, formatDistanceToNowStrict } from 'date-fns'

export function formatKES(amount) {
  const value = Number(amount ?? 0)
  return `KES ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-KE', { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number(value ?? 0)
  )
}

const NAIROBI_TZ = 'Africa/Nairobi'

export function formatTime(dateInput) {
  if (!dateInput) return '—'
  return new Intl.DateTimeFormat('en-KE', {
    timeZone: NAIROBI_TZ,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateInput))
}

export function formatDate(dateInput) {
  if (!dateInput) return '—'
  return new Intl.DateTimeFormat('en-KE', {
    timeZone: NAIROBI_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateInput))
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '—'
  return `${formatDate(dateInput)}, ${formatTime(dateInput)}`
}

export function timeAgo(dateInput) {
  if (!dateInput) return '—'
  return formatDistanceToNowStrict(new Date(dateInput), { addSuffix: true })
}

export function orderNumber(n) {
  const num = typeof n === 'string' ? n : `#${String(n).padStart(4, '0')}`
  return num.startsWith('#') ? num : `#${num}`
}

export { format as formatWithPattern }
