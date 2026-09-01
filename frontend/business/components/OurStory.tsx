'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  searchIngredients,
  searchRecipes,
  getRecipeImage,
  parseDuration,
  type IngredientResult,
  type Recipe,
} from '@/lib/api'

export default function OurStory() {
  const storyRef    = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* search state */
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [query,       setQuery]       = useState('')
  const [suggestions, setSuggestions] = useState<IngredientResult[]>([])
  const [selected,    setSelected]    = useState<IngredientResult[]>([])
  const [showDrop,    setShowDrop]    = useState(false)
  const [loadingSug,  setLoadingSug]  = useState(false)
  const [results,     setResults]     = useState<Recipe[]>([])
  const [loadingRes,  setLoadingRes]  = useState(false)

  /* scroll reveal */
  useEffect(() => {
    const el = storyRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect() } },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /* autocomplete */
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoadingSug(true)
      try {
        const res = await searchIngredients(query, 6)
        setSuggestions(res.results.filter(r => !selected.find(s => s.id === r.id)))
      } catch { setSuggestions([]) }
      finally { setLoadingSug(false) }
    }, 280)
  }, [query, selected])

  /* fetch recipes when selection changes */
  useEffect(() => {
    if (selected.length === 0) { setResults([]); return }
    setLoadingRes(true)
    searchRecipes(selected.map(s => s.id), { limit: 4 })
      .then(r => setResults(r.results))
      .catch(() => setResults([]))
      .finally(() => setLoadingRes(false))
  }, [selected])

  const addIngredient = (ing: IngredientResult) => {
    if (!selected.find(s => s.id === ing.id)) setSelected(p => [...p, ing])
    setQuery(''); setSuggestions([]); setShowDrop(false)
    inputRef.current?.focus()
  }
  const removeIngredient = (id: string) => setSelected(p => p.filter(s => s.id !== id))

  return (
    <section id="story" className="our-story-section">
      <div ref={storyRef} className="story reveal">

        {/* left: photo */}
        <div className="story-photo">
          <Image
            src="/home-fridge.jpeg"
            alt="A well-stocked fridge full of fresh ingredients"
            fill
            className="object-cover"
            sizes="(max-width: 900px) 100vw, 45vw"
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, rgba(10,21,16,0.25) 0%, rgba(10,21,16,0.5) 100%)'
          }} />
        </div>

        {/* right: text + search */}
        <div className="story-text">
          <span className="eyebrow">Our Story</span>
          <h2>Built for the fridge you actually have</h2>
          <p>
            FlavorFind started with a simple annoyance: recipe sites assume a fully stocked pantry.
            We built the opposite — a search that starts with what&apos;s real, and works backward
            to what&apos;s possible.
          </p>
          <p>
            Every recipe is matched using ingredient relationships we&apos;ve mapped across thousands
            of dishes, so the suggestions feel less like search results and more like a friend who
            knows your kitchen.
          </p>

          {/* ── search button → inline search ── */}
          {!searchOpen ? (
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 80) }}
              className="mt-2 self-start flex items-center gap-2 bg-[#d2622c] text-white text-[0.85rem] tracking-[0.03em] px-7 py-[12px] rounded-full transition-all duration-200 hover:bg-[#e0703a] hover:-translate-y-px hover:shadow-[0_10px_26px_rgba(210,98,44,0.35)] active:scale-[0.97]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              Start Searching
            </button>
          ) : (
            <div className="relative w-full" style={{ marginTop: '8px' }}>
              {/* pill input */}
              <div
                className={`flex items-center gap-2 flex-wrap bg-[#152a1e] border rounded-[40px] px-4 py-3 cursor-text transition-colors duration-200 ${showDrop ? 'border-[#e3c477]' : 'border-[#1e3328]'}`}
                onClick={() => inputRef.current?.focus()}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a9e92" strokeWidth="2" className="flex-shrink-0"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>

                {selected.map(s => (
                  <span key={s.id} className="flex items-center gap-1 bg-[rgba(227,196,119,0.15)] border border-[#e3c477]/50 text-[#e3c477] text-[0.72rem] px-2.5 py-1 rounded-full whitespace-nowrap">
                    {s.name}
                    <button onClick={() => removeIngredient(s.id)} className="text-[#e3c477]/60 hover:text-[#e3c477] leading-none ml-0.5">✕</button>
                  </span>
                ))}

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowDrop(true) }}
                  onFocus={() => setShowDrop(true)}
                  onBlur={() => setTimeout(() => setShowDrop(false), 160)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && suggestions[0]) addIngredient(suggestions[0])
                    if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); setSelected([]); setResults([]) }
                    if (e.key === 'Backspace' && !query && selected.length > 0) removeIngredient(selected[selected.length - 1].id)
                  }}
                  placeholder={selected.length === 0 ? 'e.g. chicken, garlic…' : 'Add more…'}
                  className="flex-1 bg-transparent border-none outline-none text-[#e8e2d4] text-[0.88rem] placeholder:text-[#8a9e92] min-w-[100px]"
                />
                {loadingSug && <span className="text-[10px] text-[#8a9e92] animate-pulse">…</span>}
                <button onClick={() => { setSearchOpen(false); setQuery(''); setSelected([]); setResults([]) }} className="text-[#8a9e92] hover:text-[#e8e2d4] text-[0.72rem] flex-shrink-0 ml-1">✕</button>
              </div>

              {/* autocomplete dropdown */}
              {showDrop && suggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-2 bg-[#152a1e] border border-[#1e3328] rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.5)] z-50">
                  {suggestions.map((s, i) => (
                    <li key={s.id}>
                      <button
                        onMouseDown={() => addIngredient(s)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-[0.85rem] text-[#e8e2d4] hover:bg-[#1e3328] transition-colors text-left ${i !== 0 ? 'border-t border-[#1e3328]' : ''}`}
                      >
                        <span className="capitalize font-medium">{s.name}</span>
                        <span className="text-[0.72rem] text-[#8a9e92]">{s.recipe_count.toLocaleString()} recipes</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* results */}
              {loadingRes && (
                <p className="text-[0.8rem] text-[#8a9e92] mt-4 animate-pulse">Finding recipes…</p>
              )}
              {!loadingRes && results.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {results.map(r => (
                    <a
                      key={r.id}
                      href={`https://flavorfind.co.ke/recipes/${r.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-[#152a1e] border border-[#1e3328] rounded-xl p-2.5 hover:border-[#e3c477] transition-colors"
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={getRecipeImage(r)} alt={r.name} fill className="object-cover" sizes="48px" />
                      </div>
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="text-[0.75rem] font-600 text-[#e8e2d4] truncate">{r.name}</span>
                        <span className="text-[0.65rem] text-[#8a9e92]">{r.category ?? ''}{r.total_time ? ` · ${parseDuration(r.total_time)}` : ''}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
