'use client'

import { useState, useEffect, useRef } from 'react'
import { searchIngredients, type IngredientResult } from '@/lib/api'

const DEMO_PILLS = ['chicken', 'garlic', 'lemon']

export default function Hero() {
  const [query, setQuery]             = useState('')
  const [suggestions, setSuggestions] = useState<IngredientResult[]>([])
  const [selected, setSelected]       = useState<string[]>([])
  const [showDrop, setShowDrop]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const inputRef                      = useRef<HTMLInputElement>(null)
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchIngredients(query, 7)
        setSuggestions(res.results.filter(r => !selected.includes(r.name)))
      } catch { setSuggestions([]) }
      finally   { setLoading(false) }
    }, 280)
  }, [query, selected])

  const addIngredient = (name: string) => {
    if (!selected.includes(name)) setSelected(prev => [...prev, name])
    setQuery('')
    setSuggestions([])
    setShowDrop(false)
    inputRef.current?.focus()
  }

  const removeIngredient = (name: string) =>
    setSelected(prev => prev.filter(n => n !== name))

  const handleSearch = () => {
    const all = [...selected, ...(query.trim() ? [query.trim()] : [])]
    if (all.length === 0) { inputRef.current?.focus(); return }
    const params = new URLSearchParams()
    all.forEach(n => params.append('ing', n))
    window.location.href = `/?${params.toString()}`
  }

  return (
    <section
      id="search"
      className="relative min-h-screen flex items-center justify-center text-center px-6 pt-[80px] md:pt-[120px] pb-[100px] overflow-hidden"
    >
      {/* ── Video background ── */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* ── Gradient overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          background:
            'linear-gradient(180deg, rgba(10,21,16,0.65) 0%, rgba(10,21,16,0.45) 45%, rgba(10,21,16,0.80) 100%)',
        }}
      />

      {/* ── Hero content ── */}
      <div className="relative z-[2] max-w-[760px] w-full mx-auto">

        <span className="eyebrow hero-animate block mb-3 md:mb-4" style={{ animationDelay: '0.1s' }}>
          From your kitchen, not the store
        </span>

        <h1
          className="hero-animate font-display text-[clamp(1.8rem,5vw,4.4rem)] leading-[1.1] tracking-[-0.01em] text-[#e8e2d4] mb-4 md:mb-6"
          style={{ animationDelay: '0.22s' }}
        >
          Recipes From <em className="italic text-[#e3c477]">Your</em> Ingredients
        </h1>

        <p
          className="hero-animate text-[#8a9e92] text-[0.88rem] md:text-[1.05rem] max-w-[520px] mx-auto mb-7 md:mb-11 px-2 md:px-0"
          style={{ animationDelay: '0.36s' }}
        >
          Tell us what&apos;s in your fridge. We&apos;ll tell you what to make — from
          4,000+ recipes matched to what you already have.
        </p>

        <div
          className="hero-animate flex flex-col items-center gap-[14px] md:gap-[18px]"
          style={{ animationDelay: '0.5s' }}
        >

          {/* ── Single unified search pill ── */}
          <div className="relative w-full max-w-[560px]">
            <div
              className={`flex items-center gap-2 md:gap-3 bg-[#152a1e] border rounded-[40px] px-[14px] md:px-[22px] py-[10px] md:py-[14px] cursor-text transition-colors duration-200 ${showDrop ? 'border-[#e3c477]' : 'border-[#1e3328]'}`}
              onClick={() => inputRef.current?.focus()}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a9e92" strokeWidth="2" className="flex-shrink-0 md:w-[18px] md:h-[18px]" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setShowDrop(true) }}
                onFocus={() => setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 160)}
                onKeyDown={e => {
                  if (e.key === 'Enter') suggestions[0] ? addIngredient(suggestions[0].name) : handleSearch()
                  if (e.key === 'Escape') { setShowDrop(false); setQuery('') }
                }}
                placeholder="Try 'chicken' or 'basil'"
                className="flex-1 bg-transparent border-none outline-none text-[#e8e2d4] text-[0.82rem] md:text-[0.95rem] placeholder:text-[#8a9e92] min-w-0"
              />

              {loading && <span className="text-[11px] text-[#8a9e92] animate-pulse flex-shrink-0">…</span>}

              {/* Find Recipes button */}
              <button
                onClick={handleSearch}
                className="flex-shrink-0 bg-[#d2622c] text-white text-[0.75rem] md:text-[0.82rem] tracking-[0.03em] px-3 md:px-5 py-1.5 md:py-2 rounded-full transition-all duration-200 hover:bg-[#e0703a] active:scale-[0.97]"
              >
                Find Recipes
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {showDrop && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-2 bg-[#152a1e] border border-[#1e3328] rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)] z-50 text-left">
                {suggestions.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onMouseDown={() => addIngredient(s.name)}
                      className={`w-full flex items-center justify-between px-4 md:px-5 py-2.5 md:py-3 text-[0.82rem] md:text-[0.88rem] text-[#e8e2d4] hover:bg-[#1e3328] transition-colors ${i !== 0 ? 'border-t border-[#1e3328]' : ''}`}
                    >
                      <span className="font-medium capitalize">{s.name}</span>
                      <span className="text-[0.72rem] md:text-[0.78rem] text-[#8a9e92]">{s.recipe_count.toLocaleString()} recipes</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Selected pills */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center max-w-[560px]">
              {selected.map((name) => (
                <span
                  key={name}
                  className="flex items-center gap-1.5 bg-[rgba(227,196,119,0.12)] border border-[#e3c477] text-[#e3c477] text-[0.72rem] md:text-[0.78rem] px-[12px] md:px-[14px] py-[5px] md:py-[6px] rounded-[20px]"
                >
                  {name}
                  <button
                    onClick={() => removeIngredient(name)}
                    className="text-[#e3c477]/60 hover:text-[#e3c477] text-[12px] leading-none ml-0.5"
                    aria-label={`Remove ${name}`}
                  >✕</button>
                </span>
              ))}
            </div>
          )}

          {/* Demo pills */}
          {selected.length === 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {DEMO_PILLS.map((name, i) => (
                <button
                  key={name}
                  onClick={() => addIngredient(name)}
                  className="pill bg-[rgba(227,196,119,0.08)] border border-[#e3c477]/40 text-[#e3c477]/70 text-[0.72rem] md:text-[0.78rem] px-[12px] md:px-[14px] py-[5px] md:py-[6px] rounded-[20px] hover:border-[#e3c477] hover:text-[#e3c477] transition-colors"
                  style={{ animationDelay: `${0.65 + i * 0.1}s` }}
                >
                  {name} +
                </button>
              ))}
            </div>
          )}

          {/* Browse Categories */}
          <a
            href="#categories"
            className="border border-[#1e3328] text-[#e8e2d4] px-5 md:px-7 py-[8px] md:py-[10px] rounded-full text-[0.8rem] md:text-[0.88rem] transition-all duration-200 hover:border-[#e3c477] hover:text-[#e3c477]"
          >
            Browse Categories
          </a>

        </div>
      </div>

      {/* ── Wave ── */}
      <div className="absolute bottom-[-1px] left-0 w-full z-[2] leading-[0]">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-[80px] wave-svg block">
          <path fill="#0a1510" d="M0,40 C360,90 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  )
}
