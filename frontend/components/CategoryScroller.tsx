'use client'

import { useRef, useEffect } from 'react'

interface Category {
  category: string
  recipe_count: number
}

interface Props {
  categories: Category[]
  active: string
  onSelect: (cat: string) => void
}

export default function CategoryScroller({ categories, active, onSelect }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef   = useRef(0)
  const pausedRef = useRef(false)
  const rafRef   = useRef<number>(0)

  // Duplicate for seamless loop
  const items = [...categories, ...categories]

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const step = () => {
      if (!pausedRef.current) {
        posRef.current += 0.4
        const half = track.scrollWidth / 2
        if (posRef.current >= half) posRef.current = 0
        track.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    const pause  = () => { pausedRef.current = true }
    const resume = () => { pausedRef.current = false }
    track.addEventListener('mouseenter', pause)
    track.addEventListener('mouseleave', resume)
    track.addEventListener('touchstart', pause)
    track.addEventListener('touchend', resume)

    return () => {
      cancelAnimationFrame(rafRef.current)
      track.removeEventListener('mouseenter', pause)
      track.removeEventListener('mouseleave', resume)
      track.removeEventListener('touchstart', pause)
      track.removeEventListener('touchend', resume)
    }
  }, [categories])

  return (
    <div className="overflow-hidden">
      <div
        ref={trackRef}
        className="flex gap-2 will-change-transform"
        style={{ width: 'max-content' }}
      >
        {items.map((cat, i) => (
          <button
            key={`${cat.category}-${i}`}
            onClick={() => onSelect(cat.category)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors border whitespace-nowrap ${
              active === cat.category
                ? 'bg-green-deep text-white border-green-deep'
                : 'bg-white text-green-deep border-green-deep/20 hover:bg-green-deep hover:text-white'
            }`}
          >
            {cat.category}
            <span className="ml-1.5 text-[11px] opacity-60">{cat.recipe_count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
