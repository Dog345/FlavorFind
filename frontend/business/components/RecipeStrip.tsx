'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getStripRecipes, getRecipeImage, parseDuration, type Recipe } from '@/lib/api'

export default function RecipeStrip() {
  const [recipes, setRecipes] = useState<Recipe[]>([])

  useEffect(() => {
    getStripRecipes(20).then(data => setRecipes(data)).catch(() => {})
  }, [])

  /* Need at least 1 card to show anything */
  if (recipes.length === 0) return null

  /* Duplicate the list so the scroll loops seamlessly */
  const doubled = [...recipes, ...recipes]

  return (
    <section className="rstrip-section">
      <div className="section-head" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 48px' }}>
        <span className="eyebrow">Browse</span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', color: '#e8e2d4', marginTop: 14 }}>
          Explore More Recipes
        </h2>
      </div>

      {/* Outer wrapper clips overflow, inner track animates */}
      <div className="rstrip-outer" aria-label="Auto-scrolling recipe strip">
        <div className="rstrip-track">
          {doubled.map((recipe, idx) => {
            const img      = getRecipeImage(recipe)
            const duration = parseDuration(recipe.cook_time ?? recipe.total_time)
            const rating   = recipe.rating ? parseFloat(recipe.rating) : null

            return (
              <div key={`${recipe.id}-${idx}`} className="rstrip-card">
                {/* Photo */}
                <div className="rstrip-photo">
                  <Image
                    src={img}
                    alt={recipe.name}
                    fill
                    sizes="220px"
                    className="rstrip-photo-img"
                    unoptimized
                  />
                  {/* category */}
                  <span className="rstrip-cat">{recipe.category}</span>
                </div>

                {/* Body */}
                <div className="rstrip-body">
                  <h3 className="rstrip-name">{recipe.name}</h3>

                  <div className="rstrip-meta">
                    {duration !== '—' && (
                      <span className="rstrip-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {duration}
                      </span>
                    )}
                    {rating !== null && (
                      <span className="rstrip-meta-item rstrip-gold">
                        ★ {rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <a
                    href={`/recipes/${recipe.id}`}
                    className="rstrip-btn"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    View Recipe
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
