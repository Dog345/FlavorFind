'use client'

import { useEffect, useRef } from 'react'

const LINES = [
  "We believe cooking shouldn't start with a shopping list.",
  "It should start with what's already yours.",
  "The herbs going soft in the drawer.",
  "The half onion left from last night.",
  "The rice you always seem to have too much of.",
  "FlavorFind turns that reality into a recipe,",
  "not an excuse to order in.",
  "Because the best meals aren't planned —",
  "they're discovered, one ingredient at a time.",
  "This is cooking, the way it was always meant to work.",
]

export default function NoteReveal() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const chars = Array.from(section.querySelectorAll<HTMLSpanElement>('.note-char'))

    function update() {
      if (!section || chars.length === 0) return
      const rect           = section.getBoundingClientRect()
      const scrollableDist = section.offsetHeight - window.innerHeight
      const progress       = scrollableDist > 0
        ? Math.max(0, Math.min(1, -rect.top / scrollableDist))
        : 0
      const revealCount = Math.floor(progress * chars.length)
      chars.forEach((c, i) => c.classList.toggle('note-char-lit', i < revealCount))
    }

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <section ref={sectionRef} data-note-section className="note-reveal-section">
      <div className="note-reveal-sticky">

        <span className="eyebrow" style={{ marginBottom: '26px', display: 'block', textAlign: 'center' }}>
          A Note From Us
        </span>

        <div style={{ maxWidth: '820px', textAlign: 'center' }}>
          {LINES.map((line, li) => (
            <p key={li} className="note-reveal-line">
              {line.split('').map((ch, ci) => (
                <span key={`${li}-${ci}`} className="note-char">
                  {ch === ' ' ? '\u00A0' : ch}
                </span>
              ))}
            </p>
          ))}
        </div>

      </div>
    </section>
  )
}
