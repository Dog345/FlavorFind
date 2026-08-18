'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SearchIcon, BookmarkIcon } from './Icons'
import Navbar from './Navbar'
import { searchIngredients, type IngredientResult } from '@/src/lib/api'

export default function Header() {
  const router = useRouter()

  // Search bar open/close state
  const [expanded, setExpanded]         = useState(false)
  const [query, setQuery]               = useState('')
  const [suggestions, setSuggestions]   = useState<IngredientResult[]>([])
  const [selected, setSelected]         = useState<IngredientResult[]>([])
  const [loading, setLoading]           = useState(false)
  const [showDrop, setShowDrop]         = useState(false)

  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input once expanded
  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 320)
    }
  }, [expanded])

  // Autocomplete
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchIngredients(query, 7)
        setSuggestions(res.results.filter(r => !selected.find(s => s.id === r.id)))
      } catch { setSuggestions([]) }
      finally { setLoading(false) }
    }, 280)
  }, [query, selected])

  const addIngredient = (ing: IngredientResult) => {
    setSelected(prev => [...prev, ing])
    setQuery('')
    setSuggestions([])
    setShowDrop(false)
    inputRef.current?.focus()
  }

  const removeIngredient = (id: string) =>
    setSelected(prev => prev.filter(i => i.id !== id))

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (selected.length === 0 && query.trim() === '') {
      router.push('/recipes')
      return
    }
    // Navigate to /recipes with ingredients pre-filled via URL — the recipes page
    // reads ?ingredients= on mount. For now we encode names as query params.
    const params = new URLSearchParams()
    selected.forEach(s => params.append('ing', s.name))
    if (query.trim()) params.append('ing', query.trim())
    router.push(`/recipes?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') { setExpanded(false); setQuery(''); setSelected([]) }
  }

  return (
    <>
      <Navbar />

      <header className="relative overflow-hidden pb-[50px] lg:pb-[90px]">

        {/* ── Video background ── */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src="/vid1.mp4" type="video/mp4" />
        </video>

        {/* ── Dark overlay ── */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background: 'linear-gradient(180deg,rgba(13,40,32,0.72) 0%,rgba(13,40,32,0.55) 60%,rgba(13,40,32,0.80) 100%)',
          }}
        />

        {/* ── Hero copy ── */}
        <div className="relative mx-auto max-w-[1240px] px-8" style={{ zIndex: 2 }}>
          <div className="flex flex-col items-center text-center pt-[60px] pb-[30px] lg:pt-[180px] lg:pb-[120px]">

            <span className="mb-2 block font-display text-[36px] italic font-medium text-gold-light">
              Discover
            </span>
            <h1 className="font-display text-[48px] font-semibold leading-[1.08] text-white md:text-[64px] max-w-[700px]">
              Recipes From{' '}
              <span className="font-bold text-gold-light">Your Ingredients</span>
            </h1>
            <p className="mt-6 mb-10 max-w-[480px] text-[16px] leading-[1.7] text-[#d9d3c2]">
              Tell us what&apos;s in your fridge and we&apos;ll find the perfect
              recipe for you. No more wondering what to cook tonight.
            </p>

            {/* ── Buttons row ── */}
            <div className={`flex flex-wrap justify-center items-center gap-4 w-full transition-all duration-500 ${expanded ? 'max-w-[680px]' : ''}`}>

              {/* ── Morphing Find Recipes button ── */}
              <div
                className={`
                  relative flex items-center
                  transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  ${expanded
                    ? 'flex-1 min-w-0 rounded-2xl bg-white px-4 py-3 gap-2 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)]'
                    : 'rounded-full bg-terracotta px-[28px] h-[52px] gap-2 shadow-[0_10px_24px_-8px_rgba(210,98,44,0.55)] cursor-pointer hover:-translate-y-0.5 hover:bg-terracotta-dark active:scale-95'
                  }
                `}
                onClick={!expanded ? () => setExpanded(true) : undefined}
                role={!expanded ? 'button' : undefined}
                aria-label={!expanded ? 'Open recipe search' : undefined}
              >
                {/* Search icon */}
                <SearchIcon
                  className={`flex-shrink-0 transition-all duration-300 ${
                    expanded ? 'h-4 w-4 stroke-ink-soft' : 'h-[15px] w-[15px] stroke-white'
                  }`}
                />

                {/* Collapsed label */}
                <span
                  className={`font-semibold text-[14px] whitespace-nowrap transition-all duration-300 ${
                    expanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 text-white'
                  }`}
                >
                  Find Recipes
                </span>

                {/* Expanded: pills + input + submit */}
                <form
                  onSubmit={handleSubmit}
                  className={`flex flex-1 items-center gap-2 flex-wrap transition-all duration-300 ${
                    expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden pointer-events-none'
                  }`}
                >
                  {selected.map(ing => (
                    <span
                      key={ing.id}
                      className="inline-flex items-center gap-1 rounded-full bg-green-deep/10 px-2.5 py-1 text-[12px] font-medium text-green-deep"
                    >
                      {ing.name}
                      <button
                        type="button"
                        onClick={() => removeIngredient(ing.id)}
                        className="ml-0.5 text-green-deep/50 hover:text-green-deep text-[14px] leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setShowDrop(true) }}
                    onFocus={() => setShowDrop(true)}
                    onBlur={() => setTimeout(() => setShowDrop(false), 160)}
                    onKeyDown={handleKeyDown}
                    placeholder={selected.length === 0 ? 'Type an ingredient, e.g. chicken…' : 'Add another…'}
                    className="flex-1 min-w-[120px] bg-transparent text-[14px] text-ink placeholder:text-ink-soft/60 outline-none"
                  />

                  {loading && (
                    <span className="text-[11px] text-ink-soft animate-pulse flex-shrink-0">…</span>
                  )}

                  <button
                    type="submit"
                    className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-terracotta px-4 py-2 text-[13px] font-semibold text-white hover:bg-terracotta-dark transition-colors shadow-[0_4px_12px_-4px_rgba(210,98,44,0.5)]"
                  >
                    <SearchIcon className="h-3 w-3 stroke-white" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </form>

                {/* Close button */}
                {expanded && (
                  <button
                    type="button"
                    onClick={() => { setExpanded(false); setQuery(''); setSelected([]); setSuggestions([]) }}
                    className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-ink-soft hover:bg-cream-2 hover:text-ink transition-colors text-[18px]"
                    aria-label="Close search"
                  >
                    ×
                  </button>
                )}

                {/* Autocomplete dropdown */}
                {expanded && showDrop && suggestions.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-cream-2 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.2)] overflow-hidden z-50 text-left">
                    {suggestions.map((s, i) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onMouseDown={() => addIngredient(s)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-[13px] text-ink hover:bg-cream-2 transition-colors ${
                            i !== 0 ? 'border-t border-cream-2' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <SearchIcon className="h-3.5 w-3.5 stroke-ink-soft flex-shrink-0" />
                            <span className="font-medium">{s.name}</span>
                            <span className="text-[11px] text-ink-soft capitalize">{s.category}</span>
                          </div>
                          <span className="text-[11px] text-ink-soft ml-4 flex-shrink-0">
                            {s.recipe_count.toLocaleString()} recipes
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* ── Browse Categories — stays next to Find Recipes, shrinks away when search expands ── */}
              <a
                href="/categories"
                className={`
                  inline-flex items-center gap-2 rounded-full border-[1.5px] border-white/60
                  px-[28px] h-[52px] text-[14px] font-semibold text-white
                  transition-all duration-500 hover:-translate-y-0.5 hover:bg-white/10
                  ${expanded ? 'opacity-0 pointer-events-none w-0 px-0 overflow-hidden' : 'opacity-100'}
                `}
              >
                <BookmarkIcon className="h-[15px] w-[15px] stroke-white flex-shrink-0" />
                <span className={`whitespace-nowrap transition-all duration-300 ${expanded ? 'w-0 overflow-hidden' : ''}`}>
                  Browse Categories
                </span>
              </a>

            </div>

            {/* Hint text when expanded */}
            {expanded && (
              <p className="mt-3 text-[12px] text-white/50 animate-fade-in">
                Add multiple ingredients · press Enter or hit Search
              </p>
            )}
          </div>
        </div>

        {/* ── Wave bottom edge ── */}
        <svg
          className="absolute bottom-[-2px] left-0 right-0 h-[110px] w-full"
          style={{ zIndex: 2 }}
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
        >
          <path
            fill="#f7f1e4"
            d="M0,60 C200,100 350,20 550,50 C750,80 900,10 1100,40 C1250,60 1350,30 1440,50 L1440,100 L0,100 Z"
          />
        </svg>

      </header>
    </>
  )
}
