'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { getFeaturedRecipes, getRecipeImage, parseDuration, type Recipe } from '@/lib/api'

/** Pick a truly random recipe from the pool on every page load */
function randomFrom(list: Recipe[]): Recipe {
  return list[Math.floor(Math.random() * list.length)]
}

export default function RandomRecipe() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeaturedRecipes(50)
      .then(list => {
        const pool = list.filter(r => r.image_url && r.description)
        setRecipe(randomFrom(pool.length > 0 ? pool : list))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect() } },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const time      = recipe ? parseDuration(recipe.total_time) : null
  const imgSrc    = recipe ? getRecipeImage(recipe) : null
  const recipeUrl = recipe ? `https://flavorfind.co.ke/recipes/${recipe.id}` : 'https://flavorfind.co.ke'
  const desc      = recipe?.description
    ? recipe.description.slice(0, 200).trimEnd() + (recipe.description.length > 200 ? '…' : '')
    : ''

  return (
    <section id="special" className="special-wrap">
      <div className="special-bg">
        <div ref={cardRef} className="special-card reveal">

          {/* image */}
          <div className="special-photo">
            {imgSrc && (
              <Image
                src={imgSrc}
                alt={recipe?.name ?? 'Random recipe'}
                fill
                className="object-cover"
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            )}
          </div>

          {/* info */}
          <div className="special-info">
            <span className="eyebrow">Random Recipe</span>
            <h2>{loading ? 'Loading…' : (recipe?.name ?? 'A Recipe For You')}</h2>
            <p>{desc}</p>

            <div className="special-stats">
              {time && time !== '—' && (
                <div><strong>{time}</strong>Total Time</div>
              )}
              {recipe?.servings && (
                <div><strong>{recipe.servings}</strong>Servings</div>
              )}
              {recipe?.rating && (
                <div><strong>{Number(recipe.rating).toFixed(1)}★</strong>Rating</div>
              )}
              {recipe?.calories && (
                <div><strong>{Math.round(Number(recipe.calories))}</strong>Calories</div>
              )}
            </div>

            <a
              href={recipeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-terracotta"
            >
              Cook This Recipe
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}
