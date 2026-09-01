'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { getFeaturedRecipes, getRecipeImage, parseDuration, type Recipe } from '@/lib/api'

const FEATURES = [
  {
    title: 'Search by Ingredient',
    body:  'Type what you have — we surface every recipe it fits.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" aria-hidden>
        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
      </svg>
    ),
  },
  {
    title: 'Thousands of Recipes',
    body:  'A growing library across every cuisine and course.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" aria-hidden>
        <path d="M4 19V6a2 2 0 012-2h9l5 5v10a2 2 0 01-2 2H6a2 2 0 01-2-2z"/>
      </svg>
    ),
  },
  {
    title: 'Filter by Diet & Cuisine',
    body:  'Narrow results to what fits your table tonight.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" aria-hidden>
        <path d="M4 6h16M7 12h10M10 18h4"/>
      </svg>
    ),
  },
  {
    title: 'Save Your Favorites',
    body:  'Bookmark recipes and build your own cookbook.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" aria-hidden>
        <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/>
      </svg>
    ),
  },
]

export default function FlavorsSection() {
  const featRef  = useRef<HTMLDivElement>(null)
  const headRef  = useRef<HTMLDivElement>(null)
  const gridRef  = useRef<HTMLDivElement>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])

  useEffect(() => {
    getFeaturedRecipes(4).then(list => setRecipes(list.slice(0, 4))).catch(() => {})
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) }
      }),
      { threshold: 0.15 }
    )
    if (featRef.current)  observer.observe(featRef.current)
    if (headRef.current)  observer.observe(headRef.current)
    if (gridRef.current)  observer.observe(gridRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: '#0a1510' }}>

      {/* ── 4 feature cards ── */}
      <div ref={featRef} className="features reveal-stagger" style={{ paddingTop: '80px', marginTop: 0 }}>
        {/* desktop: normal 4-col grid */}
        {FEATURES.map(f => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </div>

      {/* mobile-only: auto-scrolling looping strip */}
      <div className="features-scroll-wrap" aria-hidden="true">
        <div className="features-scroll-track">
          {[...FEATURES, ...FEATURES].map((f, i) => (
            <div key={i} className="feature-card-sm">
              <span className="feature-icon-sm">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Flavors You'll Remember ── */}
      <section id="flavors" style={{ padding: '100px 32px' }}>
        <div ref={headRef} className="section-head reveal">
          <span className="eyebrow">Handpicked</span>
          <h2>Flavors You&apos;ll Remember</h2>
        </div>

        <div ref={gridRef} className="dish-grid reveal-stagger">
          {recipes.map((r, i) => (
            <a
              key={r.id}
              href={`https://flavorfind.co.ke/recipes/${r.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`recipe-card${i === 0 ? ' recipe-card--featured' : ''}`}
            >
              <div className="recipe-photo">
                <Image
                  src={getRecipeImage(r)}
                  alt={r.name}
                  fill
                  className="object-cover recipe-photo-img"
                  sizes={i === 0 ? '600px' : '300px'}
                />
                {r.total_time && (
                  <span className="recipe-tag">{parseDuration(r.total_time)}</span>
                )}
                {/* overlay — always rendered; hidden on desktop for cards 2-4 via CSS */}
                <div className="recipe-featured-overlay">
                  {i === 0 && <span className="recipe-featured-label">Featured</span>}
                  <h3>{r.name}</h3>
                  {r.rating && (
                    <div className="recipe-stars">
                      {'★'.repeat(Math.round(Number(r.rating))).padEnd(5, '☆')}
                      {r.review_count > 0 && <span> ({r.review_count.toLocaleString()})</span>}
                    </div>
                  )}
                  <span className="view-btn">View Recipe →</span>
                </div>
              </div>
              {/* text body — visible on desktop for cards 2-4, hidden on mobile */}
              {i !== 0 && (
                <div className="recipe-body">
                  <h3>{r.name}</h3>
                  <p className="recipe-desc">
                    {r.description
                      ? r.description.slice(0, 72).trimEnd() + (r.description.length > 72 ? '…' : '')
                      : r.category ?? ''}
                  </p>
                  {r.rating && (
                    <div className="recipe-stars">
                      {'★'.repeat(Math.round(Number(r.rating))).padEnd(5, '☆')}
                      {r.review_count > 0 && <span> ({r.review_count.toLocaleString()})</span>}
                    </div>
                  )}
                  <span className="view-btn">View Recipe →</span>
                </div>
              )}
            </a>
          ))}
        </div>
      </section>

    </div>
  )
}
