import { Construction } from 'lucide-react'

export default function ComingSoonPage({ title }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Construction className="h-6 w-6" />
      </div>
      <div>
        <p className="font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-sm text-ink-400">This screen is being built in the next stage.</p>
      </div>
    </div>
  )
}
