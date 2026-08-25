export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-ink-900/6 ${className}`} />
}

export function SkeletonRows({ rows = 5, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
