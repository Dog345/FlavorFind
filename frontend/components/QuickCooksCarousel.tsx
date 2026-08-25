'use client'

import { useRef, useEffect } from 'react'
import RecipeCard from './RecipeCard'
import { type Recipe } from '@/src/lib/api'

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return ''
  const h = parseInt(m[1] ?? '0')
  const mins = parseInt(m[2] ?? '0')
  const total = h * 60 + mins
  if (total < 60) return `${total} min`
  return mins > 0 ? `${h}h ${mins}m` : `${h}h`
}

export default function QuickCooksCarousel({ recipes }: { recipes: Recipe[] }) {
  const trackRef = useRef<HTMLDivElement>(null)

  // Duplicate items so the loop is seamless
  const items = [...recipes, ...recipes]

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let pos = 0
    let raf: number
    let paused = false

    const step = () => {
      if (!paused) {
        pos += 0.5 // px per frame — tweak for speed
        const half = track.scrollWidth / 2
        if (pos >= half) pos = 0
        track.style.transform = `translateX(-${pos}px)`
      }
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)

    const pause = () => { paused = true }
    const resume = () => { paused = false }
    track.addEventListener('mouseenter', pause)
    track.addEventListener('mouseleave', resume)

    return () => {
      cancelAnimationFrame(raf)
      track.removeEventListener('mouseenter', pause)
      track.removeEventListener('mouseleave', resume)
    }
  }, [])

  return (
    <div className="overflow-hidden">
      <div ref={trackRef} className="flex gap-[22px] will-change-transform" style={{ width: 'max-content' }}>
        {items.map((r, i) => (
          <div key={`${r.id}-${i}`} className="relative w-[360px] flex-shrink-0">
            {r.total_time && (
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-green-deep/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-gold-light shadow">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                </svg>
                {formatTime(r.total_time)}
              </div>
            )}
            <RecipeCard recipe={r} imageHeight={360} />
          </div>
        ))}
      </div>
    </div>
  )
}
