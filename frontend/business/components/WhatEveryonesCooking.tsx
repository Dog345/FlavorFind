'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getTrendingRecipes, getRecipeImage, parseDuration, type Recipe } from '@/lib/api'

/* ── Skeleton card ─────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="wec-card wec-skeleton" aria-hidden="true">
      <div className="wec-photo wec-skel-photo" />
      <div className="wec-body">
        <div className="wec-skel-line wec-skel-tag" />
        <div className="wec-skel-line wec-skel-title" />
        <div className="wec-skel-line" />
        <div className="wec-skel-line wec-skel-short" />
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────── */
export default function WhatEveryonesCooking() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    getTrendingRecipes(4)
      .then(data => { setRecipes(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  return (
    <section className="wec-section">

      {/* ── Header ── */}
      <div className="section-head" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 64px' }}>
        <span className="eyebrow">Right now</span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', color: '#e8e2d4', marginTop: 14 }}>
          What Everyone&apos;s Cooking
        </h2>
        <p className="wec-subhead">
          Popular recipes being made in kitchens around you — updated from our live database.
        </p>
      </div>

      {error && (
        <p className="wec-error">Could not load recipes — please try again later.</p>
      )}

      {/* ── 4-card grid ── */}
      <div className="wec-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : recipes.map((recipe, idx) => {
              const imgSrc   = getRecipeImage(recipe)
              const duration = parseDuration(recipe.cook_time ?? recipe.total_time)
              const rating   = recipe.rating ? parseFloat(recipe.rating) : null

              return (
                <article key={recipe.id} className="wec-card">
                  {/* Rank */}
                  <div className="wec-rank" aria-label={`Rank ${idx + 1}`}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Photo */}
                  <div className="wec-photo">
                    <Image
                      src={imgSrc}
                      alt={recipe.name}
                      fill
                      sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                      className="wec-photo-img"
                      unoptimized
                    />
                    <span className="wec-cat">{recipe.category}</span>
                    {rating !== null && (
                      <span className="wec-rating-badge" aria-label={`Rating ${rating.toFixed(1)}`}>
                        ★ {rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="wec-body">
                    <h3 className="wec-name">{recipe.name}</h3>
                    <p className="wec-desc">
                      {recipe.description
                        ? recipe.description.slice(0, 90).trimEnd() +
                          (recipe.description.length > 90 ? '…' : '')
                        : 'A delicious recipe from the FlavorFind collection.'}
                    </p>

                    <div className="wec-meta">
                      {duration !== '—' && (
                        <span className="wec-chip">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {duration}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="wec-chip">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          </svg>
                          {recipe.servings} servings
                        </span>
                      )}
                      {recipe.review_count > 0 && (
                        <span className="wec-chip wec-chip-gold">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                          {recipe.review_count} reviews
                        </span>
                      )}
                    </div>

                    <a href={`/recipes/${recipe.id}`} className="wec-btn">
                      Cook This
                    </a>
                  </div>
                </article>
              )
            })}
      </div>

      {/* ── CTA ── */}
      <div className="wec-cta">
        <div className="wec-cta-inner">
          <span className="eyebrow">Your kitchen, your rules</span>
          <h2 className="wec-cta-heading">
            What&apos;s hiding in your fridge?
          </h2>
          <p className="wec-cta-body">
            Stop staring at ingredients wondering what to make. Tell FlavorFind
            what you have — we&apos;ll find something worth cooking in seconds.
          </p>
          <div className="wec-cta-btns">
            <a href="https://flavorfind.co.ke" target="_blank" rel="noopener noreferrer" className="wec-cta-primary">
              Search by Ingredient
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href="https://flavorfind.co.ke/recipes" target="_blank" rel="noopener noreferrer" className="wec-cta-secondary">
              Browse All Recipes
            </a>
          </div>
        </div>

        {/* decorative blobs */}
        <div className="wec-cta-blob wec-cta-blob-1" aria-hidden="true" />
        <div className="wec-cta-blob wec-cta-blob-2" aria-hidden="true" />
      </div>
    </section>
  )
}
