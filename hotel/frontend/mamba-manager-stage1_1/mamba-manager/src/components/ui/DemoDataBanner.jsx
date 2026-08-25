import { Info } from 'lucide-react'

export default function DemoDataBanner() {
  return (
    <div className="mb-6 flex items-center gap-2 rounded-xl border border-warning-500/20 bg-warning-50 px-4 py-2.5 text-sm text-ink-700">
      <Info className="h-4 w-4 shrink-0 text-warning-500" />
      Showing sample data — couldn't reach the API at{' '}
      <code className="rounded bg-white px-1.5 py-0.5 text-xs">{import.meta.env.VITE_API_URL}</code>. Connect your
      backend to see live numbers.
    </div>
  )
}
