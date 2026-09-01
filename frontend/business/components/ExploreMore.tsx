'use client'

import { useEffect, useRef, useState } from 'react'
import { getFeaturedRecipes, getRecipeImage, parseDuration, type Recipe } from '@/lib/api'
import Image from 'next/image'

export default function ExploreMore() {
  const splitRef = useRef<HTMLDivElement>(null)
  const [bgRecipe, setBgRecipe] = useState<Recipe | null>(null)
  const [sideRecipes, setSideRecipes] = useState<Recipe[]>([])

  useEffect(() => {
    getFeaturedRecipes(20).then(list => {
      const withImg = list.filter(r => r.image_url)
      setBgRecipe(withImg[0] ?? list[0] ?? null)
      // next 3 with images for the cards
      const cards = withImg.slice(1, 4)
      setSideRecipes(cards.length === 3 ? cards : list.slice(1, 4))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); observer.unobserve(e.target) }
      }),
      { threshold: 0.2 }
    )
    if (splitRef.current) observer.observe(splitRef.current)
    return () => observer.disconnect()
  }, [])

  const imgSrc = bgRecipe ? getRecipeImage(bgRecipe) : null

  return (
    <>
      {/* ── split reveal ── */}
      <section ref={splitRef} id="explore" className="split-reveal reverse">

        {/* left: image + side recipe cards */}
        <div className="split-image-col">
          <div className="split-image wipe-down">
            {imgSrc && (
              <Image src={imgSrc} alt="Explore recipes" fill className="object-cover" sizes="calc(50vw - 100px)" />
            )}
          </div>

          {/* 3 small recipe cards stacked on the right side of the image */}
          {sideRecipes.length > 0 && (
            <div className="explore-side-cards" aria-label="Featured recipes">
              {sideRecipes.map(r => (
                <div key={r.id} className="explore-side-card">
                  <div className="explore-side-card-img">
                    <Image
                      src={getRecipeImage(r)}
                      alt={r.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="explore-side-card-info">
                    <span className="explore-side-card-name">{r.name}</span>
                    <span className="explore-side-card-meta">
                      {r.category ?? 'Recipe'} · {parseDuration(r.total_time)}
                    </span>
                    <a
                      href={`https://flavorfind.co.ke/recipes/${r.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="explore-view-btn"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* right: text + below-text recipe cards */}
        <div className="split-text">
          <span className="eyebrow">Explore More</span>
          <h2>Every cuisine, one search away</h2>
          <p>
            From Kenyan classics to weeknight pasta, browse by category instead of
            ingredient — a different way in when you already know what you&apos;re craving.
          </p>
          <a href="https://flavorfind.co.ke" target="_blank" rel="noopener noreferrer"
            className="btn-terracotta">
            Browse Categories
          </a>

          {/* 3 small recipe cards below the text */}
          {sideRecipes.length > 0 && (
            <div className="explore-below-cards" aria-label="More recipes">
              {sideRecipes.map(r => (
                <div key={r.id} className="explore-below-card">
                  <div className="explore-below-card-img">
                    <Image
                      src={getRecipeImage(r)}
                      alt={r.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="explore-below-card-info">
                    <span className="explore-below-card-name">{r.name}</span>
                    <span className="explore-below-card-meta">{r.category ?? 'Recipe'}</span>
                  </div>
                  <a
                    href={`https://flavorfind.co.ke/recipes/${r.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explore-view-btn explore-view-btn--right"
                  >
                    View Recipe
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>
    </>
  )
}
