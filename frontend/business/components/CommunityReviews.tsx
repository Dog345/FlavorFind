'use client'

import { useEffect, useRef } from 'react'

const REVIEWS = [
  {
    quote:  'I stopped throwing out wilted herbs. FlavorFind always finds something worth making.',
    name:   'Achieng M.',
    location: 'Nairobi',
  },
  {
    quote:  'The ingredient search actually understands substitutions. Genuinely useful, not just a search bar.',
    name:   'Brian K.',
    location: 'Mombasa',
  },
  {
    quote:  "Chef Special every week has become our Sunday ritual. Never a bad pick.",
    name:   'Wanjiru T.',
    location: 'Nakuru',
  },
]

export default function CommunityReviews() {
  const headRef  = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) }
      }),
      { threshold: 0.2 }
    )
    if (headRef.current)  observer.observe(headRef.current)
    if (trackRef.current) observer.observe(trackRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="reviews-section">
      <div style={{ padding: '70px 32px' }}>

        <div ref={headRef} className="section-head reveal">
          <span className="eyebrow">From the community</span>
          <h2>Loved in Kitchens Everywhere</h2>
        </div>

        <div ref={trackRef} className="review-track reveal-stagger">
          {REVIEWS.map((r, i) => (
            <div key={i} className="review-card">
              {/* opening quote mark */}
              <span className="review-quote-mark">&ldquo;</span>
              <p className="review-quote">{r.quote}</p>
              <p className="review-author">
                — <strong>{r.name}</strong>, {r.location}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
