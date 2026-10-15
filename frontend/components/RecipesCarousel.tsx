'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { getTrendingRecipes, getRecipeImage, parseDuration, type Recipe } from '@/lib/api'

export default function RecipesCarousel() {
  const [recipes,  setRecipes]  = useState<Recipe[]>([])
  const [active,   setActive]   = useState(0)
  const [loading,  setLoading]  = useState(true)
  const autoRef                 = useRef<ReturnType<typeof setInterval> | null>(null)
  const trackRef                = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getTrendingRecipes(9)
      .then(res => { setRecipes(res.results.slice(0, 9)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  /* auto-advance every 4s */
  useEffect(() => {
    if (recipes.length === 0) return
    autoRef.current = setInterval(() => {
      setActive(p => (p + 1) % recipes.length)
    }, 4000)
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [recipes.length])

  const goTo = (i: number) => {
    if (autoRef.current) clearInterval(autoRef.current)
    setActive(i)
  }

  if (loading) {
    return (
      <section className="w-full bg-[#0a1510] px-6 md:px-[80px] py-16">
        <div className="flex gap-6 animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="flex-1 bg-[#152a1e] rounded-2xl h-[340px]" />
          ))}
        </div>
      </section>
    )
  }

  if (recipes.length === 0) return null

  /* show 3 cards at a time, centered on `active` */
  const getVisible = () => {
    const len = recipes.length
    return [
      recipes[(active - 1 + len) % len],
      recipes[active],
      recipes[(active + 1) % len],
    ]
  }

  const [left, center, right] = getVisible()

  return (
    <section className="w-full bg-[#0a1510] px-6 md:px-[80px] pt-0 pb-20 overflow-hidden">

      {/* heading */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="eyebrow block mb-2">Explore More</span>
          <h2 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] text-[#e8e2d4]">
            Recipes You&apos;ll <em className="italic text-[#e3c477]">Love</em>
          </h2>
        </div>
        {/* arrows */}
        <div className="flex gap-3">
          <button
            onClick={() => goTo((active - 1 + recipes.length) % recipes.length)}
            className="w-10 h-10 rounded-full border border-[#1e3328] flex items-center justify-center text-[#8a9e92] hover:border-[#e3c477] hover:text-[#e3c477] transition-all duration-200"
            aria-label="Previous"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button
            onClick={() => goTo((active + 1) % recipes.length)}
            className="w-10 h-10 rounded-full border border-[#1e3328] flex items-center justify-center text-[#8a9e92] hover:border-[#e3c477] hover:text-[#e3c477] transition-all duration-200"
            aria-label="Next"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* cards */}
      <div ref={trackRef} className="flex gap-5 items-stretch">

        {/* left card — hidden on mobile */}
        <div
          className="hidden md:flex flex-1 relative rounded-2xl overflow-hidden cursor-pointer opacity-50 hover:opacity-70 transition-all duration-500 scale-[0.92]"
          style={{ minHeight: '360px' }}
          onClick={() => goTo((active - 1 + recipes.length) % recipes.length)}
        >
          <Image
            src={getRecipeImage(left)}
            alt={left.name}
            fill
            className="object-cover"
            sizes="30vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,21,16,0.9)] via-[rgba(10,21,16,0.3)] to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-[#e8e2d4] font-display text-[1rem] leading-snug line-clamp-2">{left.name}</p>
            <p className="text-[#8a9e92] text-[0.72rem] mt-1">{left.category}</p>
          </div>
        </div>

        {/* center card — large + full detail */}
        <div
          className="flex-1 md:flex-[1.6] relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500"
          style={{ minHeight: '420px' }}
        >
          <Image
            src={getRecipeImage(center)}
            alt={center.name}
            fill
            className="object-cover"
            sizes="45vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,21,16,0.95)] via-[rgba(10,21,16,0.35)] to-transparent" />

          {/* center card content */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            {center.category && (
              <span className="text-[#e3c477] text-[0.68rem] tracking-widest uppercase mb-2 block">{center.category}</span>
            )}
            <h3 className="font-display text-[1.4rem] text-[#e8e2d4] leading-snug mb-2">{center.name}</h3>
            <p className="text-[#8a9e92] text-[0.82rem] line-clamp-2 mb-4">{center.description}</p>

            {/* stats row */}
            <div className="flex items-center gap-4 text-[0.72rem] text-[#8a9e92]">
              {center.total_time && (
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                  </svg>
                  {parseDuration(center.total_time)}
                </span>
              )}
              {center.servings && (
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  {center.servings} servings
                </span>
              )}
              {center.rating && (
                <span className="text-[#e3c477]">★ {Number(center.rating).toFixed(1)}</span>
              )}
            </div>

            <a
              href={`https://flavorfind.co.ke/recipes/${center.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 bg-[#d2622c] text-white text-[0.78rem] px-5 py-2 rounded-full hover:bg-[#e0703a] transition-all duration-200"
            >
              View Recipe
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>

        {/* right card — hidden on mobile */}
        <div
          className="hidden md:flex flex-1 relative rounded-2xl overflow-hidden cursor-pointer opacity-50 hover:opacity-70 transition-all duration-500 scale-[0.92]"
          style={{ minHeight: '360px' }}
          onClick={() => goTo((active + 1) % recipes.length)}
        >
          <Image
            src={getRecipeImage(right)}
            alt={right.name}
            fill
            className="object-cover"
            sizes="30vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,21,16,0.9)] via-[rgba(10,21,16,0.3)] to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-[#e8e2d4] font-display text-[1rem] leading-snug line-clamp-2">{right.name}</p>
            <p className="text-[#8a9e92] text-[0.72rem] mt-1">{right.category}</p>
          </div>
        </div>

      </div>

      {/* dot indicators */}
      <div className="flex gap-1.5 justify-center mt-8">
        {recipes.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === active ? 'w-5 h-1.5 bg-[#e3c477]' : 'w-1.5 h-1.5 bg-[#1e3328] hover:bg-[#8a9e92]'
            }`}
            aria-label={`Go to recipe ${i + 1}`}
          />
        ))}
      </div>

    </section>
  )
}
