import { useEffect, useState } from 'react'

function getElapsedMinutes(createdAt) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
}

export default function LiveTimer({ createdAt }) {
  const [minutes, setMinutes] = useState(() => getElapsedMinutes(createdAt))

  useEffect(() => {
    const interval = setInterval(() => setMinutes(getElapsedMinutes(createdAt)), 15000)
    return () => clearInterval(interval)
  }, [createdAt])

  const color = minutes < 10 ? 'text-success-500 bg-success-500/10' : minutes < 20 ? 'text-warning-500 bg-warning-500/10' : 'text-danger-500 bg-danger-500/10'

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${color}`}>
      {minutes} min
    </span>
  )
}
