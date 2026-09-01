'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  getCategories,
  searchIngredients,
  searchRecipes,
  getRecipeImage,
  parseDuration,
  type IngredientResult,
  type Recipe,
} from '@/lib/api'

/* ─── badge data ──────────────────────────────────────────────── */
const BADGES = [
  { id: 'recipes', top: '8%',    right: '-4%', label: '4,000+',   sub: 'Recipes',      delay: '0s'   },
  { id: 'free',    bottom: '12%', left: '-6%',  label: 'Free',     sub: 'No sign-up',   delay: '0.1s' },
  { id: 'time',    bottom: '28%', right: '-8%', label: '< 30 min', sub: 'Most recipes', delay: '0.2s' },
]

interface Stats {
  totalRecipes: string
  totalCategories: string
  topCategory: string
}

export default function DishReveal() {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* scroll + tilt */
  const [progress, setProgress] = useState(0)
  const [tilt,     setTilt]     = useState({ x: 0, y: 0 })

  /* stats */
  const [stats, setStats] = useState<Stats>({
    totalRecipes:    '4K+',
    totalCategories: '300+',
    topCategory:     'Dessert',
  })

  /* search state — lifted to section level so results span full width */
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [query,        setQuery]        = useState('')
  const [suggestions,  setSuggestions]  = useState<IngredientResult[]>([])
  const [selected,     setSelected]     = useState<IngredientResult[]>([])
  const [showDrop,     setShowDrop]     = useState(false)
  const [loadingSug,   setLoadingSug]   = useState(false)
  const [results,      setResults]      = useState<Recipe[]>([])
  const [loadingRes,   setLoadingRes]   = useState(false)

  /* ── fetch stats ── */
  useEffect(() => {
    getCategories().then(data => {
      const total = data.categories.reduce((s, c) => s + c.recipe_count, 0)
      const fmt   = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K+` : String(n)
      setStats({
        totalRecipes:    fmt(total),
        totalCategories: String(data.categories.length),
        topCategory:     data.categories[0]?.category ?? 'Dessert',
      })
    }).catch(() => {})
  }, [])

  /* ── scroll progress ── */
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onScroll = () => {
      const raw = 1 - el.getBoundingClientRect().top / window.innerHeight
      setProgress(Math.max(0, Math.min(1, raw)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── mouse tilt ── */
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      setTilt({ x: ((e.clientY - (r.top + r.height/2)) / (r.height/2)) * -6, y: ((e.clientX - (r.left + r.width/2)) / (r.width/2)) * 8 })
    }
    const onLeave = () => setTilt({ x: 0, y: 0 })
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
  }, [])

  /* ── autocomplete ── */
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

  /* ── fetch recipes when selection changes ── */
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

  /* ── easing ── */
  const eased   = progress < 0.5 ? 2*progress*progress : 1 - Math.pow(-2*progress+2,2)/2
  const isIn    = progress > 0.5
  const scale   = 0.4 + eased * 0.6
  const rotY    = (1 - eased) * -35
  const rotX    = (1 - eased) * 10
  const opacity = Math.min(1, progress * 1.8)
  const transform = isIn
    ? `scale(${scale}) rotateX(${tilt.x}deg) rotateY(${tilt.y + rotY}deg)`
    : `scale(${scale}) rotateY(${rotY}deg) rotateX(${rotX}deg)`

  return (
    <section ref={sectionRef} className="relative md:min-h-screen flex flex-col justify-center" style={{ perspective: '1200px' }}>

      {/* ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 40% 55%, rgba(210,98,44,0.10) 0%, rgba(30,51,40,0.35) 40%, transparent 72%)', opacity: eased }} />

      {/* ── two-column top ── */}
      <div className="relative z-10 w-full flex flex-col-reverse md:flex-row md:items-stretch gap-12 md:gap-16 px-6 md:px-[100px] py-4 md:py-20">

        {/* LEFT: who is FlavorFind + search */}
        <div
          className="flex-1 flex flex-col gap-[25px] text-left self-stretch"
          style={{ opacity: isIn ? eased : 0, transform: isIn ? 'translateX(0)' : 'translateX(-40px)', transition: 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,0.8,0.24,1)' }}
        >
          <span className="eyebrow hidden md:block">Who is FlavorFind</span>

          <h2 className="font-display text-[clamp(2rem,3.8vw,3rem)] leading-[1.15] text-[#e8e2d4] hidden md:block">
            The recipe finder built around <em className="italic text-[#e3c477]">your</em> fridge
          </h2>

          <p className="text-[#8a9e92] text-[0.98rem] leading-relaxed max-w-[440px] hidden md:block">
            Most recipe sites assume a fully stocked pantry. FlavorFind flips it — tell us what you already have, and we surface every recipe it can become.
          </p>

          <p className="text-[#8a9e92] text-[0.98rem] leading-relaxed max-w-[440px] hidden md:block">
            Every match is built on ingredient relationships mapped across thousands of dishes, so suggestions feel less like search results and more like a friend who knows your kitchen.
          </p>

          <p className="text-[#8a9e92] text-[0.98rem] leading-relaxed max-w-[440px] hidden md:block">
            Whether you have three things left in the fridge or a fully loaded pantry, FlavorFind adapts. Filter by cuisine, dietary preference, or cook time — and discover meals you never thought those ingredients could make. No wasted food, no last-minute takeout, no stress.
          </p>

          {/* live stats */}
          <div className="hidden md:flex gap-8 mt-2">
            {[
              { val: stats.totalRecipes,    label: 'Recipes'     },
              { val: stats.totalCategories, label: 'Categories'  },
              { val: stats.topCategory,     label: 'Top Cuisine' },
            ].map(s => (
              <div key={s.label}>
                <div className="font-display text-[1.6rem] text-[#e3c477] font-semibold leading-none">{s.val}</div>
                <div className="text-[#8a9e92] text-[0.72rem] tracking-widest uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── search bar or button ── */}
          {!searchOpen ? (
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 80) }}
              className="mt-2 self-start flex items-center gap-2 bg-[#d2622c] text-white text-[0.85rem] tracking-[0.03em] px-7 py-[12px] rounded-full transition-all duration-200 hover:bg-[#e0703a] hover:-translate-y-px hover:shadow-[0_10px_26px_rgba(210,98,44,0.35)] active:scale-[0.97]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              Start Searching
            </button>
          ) : (
            <div className="relative w-full max-w-[440px]">
              {/* pill */}
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
                  placeholder={selected.length === 0 ? "e.g. chicken, garlic…" : "Add more…"}
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
            </div>
          )}
        </div>

        {/* RIGHT: 3D burger */}
        <div className="flex-[1.3] flex flex-col items-center" style={{ perspective: '1200px', marginTop: '-100px' }}>
          <p className="eyebrow mb-5" style={{ opacity, transition: 'opacity 0.3s' }}>Crafted from your kitchen</p>

          <div
            className="relative select-none w-full"
            style={{
              maxWidth: '680px', transformStyle: 'preserve-3d', transform, opacity,
              transition: isIn ? 'transform 0.14s ease-out' : 'transform 0.06s linear',
              animation: isIn ? 'dishFloat 5.5s ease-in-out 0s infinite' : 'none',
              filter: `drop-shadow(0 ${40*eased}px ${48*eased}px rgba(0,0,0,0.65))`,
            }}
          >
            <div aria-hidden className="absolute rounded-full pointer-events-none" style={{ inset: '-18px', background: 'radial-gradient(circle, rgba(227,196,119,0.18) 0%, rgba(210,98,44,0.08) 45%, transparent 72%)', filter: 'blur(12px)', opacity: eased }} />
            <div aria-hidden className="absolute pointer-events-none" style={{ bottom: '-28px', left: '50%', transform: 'translateX(-50%)', width: '72%', height: '28px', background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)', filter: 'blur(10px)', opacity: eased }} />

            <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
              <Image src="/burger.jpeg" alt="Cheesy burger with fries on a wooden plate" fill className="object-contain" sizes="(max-width: 768px) 88vw, 720px" priority />

              {/* steam — centred over the burger bun */}
              <svg
                aria-hidden
                className="absolute pointer-events-none z-10"
                style={{
                  top: '18%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  opacity: isIn ? 0.38 * eased : 0,
                  transition: 'opacity 0.4s ease',
                  width: '160px',
                  height: '70px',
                  overflow: 'visible',
                }}
                viewBox="0 0 180 80"
              >
                {/* original 3 */}
                <path className="steam-path" d="M20 70 C16 52 30 44 24 24" stroke="#e8e2d4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path className="steam-path" d="M45 72 C50 54 36 44 42 22" stroke="#e8e2d4" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ animationDelay: '0.7s' }} />
                <path className="steam-path" d="M68 68 C64 50 76 42 70 22" stroke="#e8e2d4" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ animationDelay: '1.4s' }} />
                {/* 6 new */}
                <path className="steam-path" d="M90 70 C86 52 100 44 94 24"  stroke="#e8e2d4" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ animationDelay: '0.35s' }} />
                <path className="steam-path" d="M112 72 C116 54 102 44 108 22" stroke="#e8e2d4" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ animationDelay: '1.05s' }} />
                <path className="steam-path" d="M134 68 C130 50 142 42 136 22" stroke="#e8e2d4" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ animationDelay: '1.75s' }} />
                <path className="steam-path" d="M155 70 C151 52 163 44 158 24" stroke="#e8e2d4" strokeWidth="2"   fill="none" strokeLinecap="round" style={{ animationDelay: '0.55s' }} />
                <path className="steam-path" d="M10  65 C6  48  18  40  13 20"  stroke="#e8e2d4" strokeWidth="2"   fill="none" strokeLinecap="round" style={{ animationDelay: '1.2s'  }} />
                <path className="steam-path" d="M170 66 C166 49 178 41 173 21" stroke="#e8e2d4" strokeWidth="2"   fill="none" strokeLinecap="round" style={{ animationDelay: '2.1s'  }} />
              </svg>
            </div>

            {BADGES.map(b => (
              <div key={b.id} className="badge-float absolute bg-[#152a1e] border border-[#e3c477]/35 rounded-2xl px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                style={{ top: b.top, bottom: b.bottom, left: b.left, right: b.right, opacity: isIn ? eased : 0, transform: isIn ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.88)', transition: `opacity 0.5s ease ${b.delay}, transform 0.5s cubic-bezier(0.16,0.8,0.24,1) ${b.delay}`, zIndex: 2 }}
              >
                <div className="text-[#e3c477] font-display text-[1.05rem] font-semibold leading-none whitespace-nowrap">{b.label}</div>
                <div className="text-[#8a9e92] text-[0.68rem] tracking-wider uppercase mt-[5px]">{b.sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center" style={{ opacity: isIn ? eased : 0, transition: 'opacity 0.4s ease' }}>
            <p className="font-display italic text-[#8a9e92] text-[1rem]">Tell us what&apos;s in your fridge — we&apos;ll find what to make</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-[#1e3328]" />
              <span className="eyebrow text-[#e3c477]/50">FlavorFind</span>
              <div className="h-px w-12 bg-[#1e3328]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── RESULTS: full-width bottom of section ── */}
      {(loadingRes || results.length > 0) && (
        <div className="relative z-10 w-full border-t border-[#1e3328] px-6 md:px-[100px] py-10">
          <div className="flex items-center justify-between mb-6">
            <span className="eyebrow">
              {loadingRes ? 'Finding recipes…' : `${results.length} recipes matched`}
            </span>
            {!loadingRes && results.length > 0 && (
              <span className="text-[0.75rem] text-[#8a9e92]">Based on: {selected.map(s => s.name).join(', ')}</span>
            )}
          </div>

          {loadingRes ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#152a1e] border border-[#1e3328] rounded-xl overflow-hidden animate-pulse">
                  <div className="h-[160px] bg-[#1e3328]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-[#1e3328] rounded w-3/4" />
                    <div className="h-3 bg-[#1e3328] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {results.map(r => (
                <a
                  key={r.id}
                  href={`https://flavorfind.co.ke/recipes/${r.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-[#152a1e] border border-[#1e3328] rounded-xl overflow-hidden hover:border-[#e3c477] transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="relative w-full h-[160px] bg-[#1e3328]">
                    <Image src={getRecipeImage(r)} alt={r.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="300px" />
                    {r.total_time && (
                      <span className="absolute top-2 left-2 bg-[rgba(10,21,16,0.85)] text-[#e3c477] text-[0.65rem] px-2 py-0.5 rounded-full">{parseDuration(r.total_time)}</span>
                    )}
                    {r.category && (
                      <span className="absolute top-2 right-2 bg-[rgba(10,21,16,0.85)] text-[#8a9e92] text-[0.65rem] px-2 py-0.5 rounded-full">{r.category}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[#e8e2d4] text-[0.85rem] font-medium leading-snug line-clamp-2">{r.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      {r.rating && <span className="text-[#e3c477] text-[0.72rem]">★ {Number(r.rating).toFixed(1)}</span>}
                      {r.review_count > 0 && <span className="text-[#8a9e92] text-[0.68rem]">{r.review_count.toLocaleString()} reviews</span>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}


    </section>
  )
}
