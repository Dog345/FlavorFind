'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  getFeaturedRecipes,
  getRecipeImage,
  parseDuration,
  type Recipe,
} from '@/lib/api'

/* ── Star renderer ─────────────────────────────────────────────── */
function Stars({ rating }: { rating: string | null }) {
  const num = parseFloat(rating ?? '0')
  if (!num) return null
  const full  = Math.min(5, Math.floor(num))
  const half  = num % 1 >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return (
    <span className="cf-stars" aria-label={`${num.toFixed(1)} out of 5`}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
      <span className="cf-rating-num">&nbsp;{num.toFixed(1)}</span>
    </span>
  )
}

/* ── Heart button (UI-only optimistic toggle) ──────────────────── */
function HeartBtn({ base }: { base: number }) {
  const [liked, setLiked] = useState(false)
  const count = liked ? base + 1 : base
  const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)
  return (
    <button
      className={`cf-heart-btn${liked ? ' liked' : ''}`}
      onClick={() => setLiked(l => !l)}
      aria-label={liked ? 'Unlike recipe' : 'Like recipe'}
      aria-pressed={liked}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {label}
    </button>
  )
}

/* ── Skeleton card shown while loading ─────────────────────────── */
function SkeletonCard() {
  return (
    <div className="cf-card cf-skeleton" aria-hidden="true">
      <div className="cf-photo cf-skel-photo" />
      <div className="cf-body">
        <div className="cf-skel-line cf-skel-title" />
        <div className="cf-skel-line" />
        <div className="cf-skel-line cf-skel-short" />
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────── */
export default function CommunityFavorites() {
  const headRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  /* fetch top-rated recipes from the backend */
  useEffect(() => {
    getFeaturedRecipes(6)
      .then(data => {
        setRecipes(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  /* scroll-reveal */
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            observer.unobserve(e.target)
          }
        }),
      { threshold: 0.12 }
    )
    if (headRef.current) observer.observe(headRef.current)
    if (gridRef.current) observer.observe(gridRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="cf-section">
      {/* ── Section header ── */}
      <div ref={headRef} className="section-head reveal cf-head">
        <span className="eyebrow">Loved by the community</span>
        <h2>Community Favourites</h2>
        <p className="cf-subhead">
          The highest-rated recipes FlavorFind users return to again and again.
        </p>
      </div>

      {/* ── Error state ── */}
      {error && (
        <p className="cf-error">Could not load recipes — please try again later.</p>
      )}

      {/* ── Grid ── */}
      <div ref={gridRef} className="cf-grid reveal-stagger">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : recipes.map(recipe => {
              const imgSrc   = getRecipeImage(recipe)
              const duration = parseDuration(recipe.cook_time ?? recipe.total_time)
              const calories = recipe.calories
                ? `${Math.round(parseFloat(recipe.calories))} kcal`
                : null

              return (
                <article key={recipe.id} className="cf-card">
                  {/* Photo */}
                  <div className="cf-photo">
                    <Image
                      src={imgSrc}
                      alt={recipe.name}
                      fill
                      sizes="(max-width:600px) 100vw, (max-width:1000px) 50vw, 33vw"
                      className="cf-photo-img"
                      unoptimized
                    />
                    {/* Category tag */}
                    <span className="cf-tag">{recipe.category}</span>
                    {/* Review count badge */}
                    {recipe.review_count > 0 && (
                      <span className="cf-saves-badge" aria-label={`${recipe.review_count} reviews`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        {recipe.review_count}
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="cf-body">
                    <h3 className="cf-name">{recipe.name}</h3>
                    <p className="cf-desc">
                      {recipe.description
                        ? recipe.description.slice(0, 110).trimEnd() + (recipe.description.length > 110 ? '…' : '')
                        : 'A delicious recipe from the FlavorFind collection.'}
                    </p>

                    {/* Stats row */}
                    <div className="cf-meta">
                      {duration !== '—' && (
                        <span className="cf-meta-item">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {duration}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="cf-meta-item">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          {recipe.servings} servings
                        </span>
                      )}
                      {calories && (
                        <span className="cf-meta-item">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-1-13v6l5 3-1 1.73-6-3.5V7z"/></svg>
                          {calories}
                        </span>
                      )}
                    </div>

                    <Stars rating={recipe.rating} />

                    {/* Footer */}
                    <div className="cf-footer">
                      <HeartBtn base={recipe.review_count} />
                      <a
                        href={`/recipes/${recipe.id}`}
                        className="cf-view-btn"
                      >
                        View Recipe
                      </a>
                    </div>
                  </div>
                </article>
              )
            })}
      </div>
    </section>
  )
}
