'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { searchIngredients, searchRecipes, getRecipeImage, parseDuration, type IngredientResult, type Recipe } from '@/lib/api'

const NAV_LINKS = [
  { label: 'Recipes',      href: '#dishes'     },
  { label: 'Categories',   href: '#categories' },
  { label: 'Our Story',    href: '#story'      },
  { label: 'Chef Special', href: '#special'    },
  { label: 'About',        href: '#about'      },
]

export default function Navbar() {
  const [scrolled,     setScrolled]     = useState(false)
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [query,        setQuery]        = useState('')
  const [suggestions,  setSuggestions]  = useState<IngredientResult[]>([])
  const [selected,     setSelected]     = useState<IngredientResult[]>([])
  const [results,      setResults]      = useState<Recipe[]>([])
  const [loadingSug,   setLoadingSug]   = useState(false)
  const [loadingRes,   setLoadingRes]   = useState(false)
  const [showDrop,     setShowDrop]     = useState(false)

  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef    = useRef<HTMLDivElement>(null)

  /* ── scroll condense ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── close on outside click ── */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeSearch()
      }
    }
    if (searchOpen) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [searchOpen])

  /* ── ingredient autocomplete ── */
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoadingSug(true)
      try {
        const res = await searchIngredients(query, 6)
        setSuggestions(res.results.filter(r => !selected.find(s => s.id === r.id)))
      } catch { setSuggestions([]) }
      finally   { setLoadingSug(false) }
    }, 280)
  }, [query, selected])

  /* ── fetch recipes when selected changes ── */
  useEffect(() => {
    if (selected.length === 0) { setResults([]); return }
    setLoadingRes(true)
    searchRecipes(selected.map(s => s.id), { limit: 6 })
      .then(res => setResults(res.results))
      .catch(() => setResults([]))
      .finally(() => setLoadingRes(false))
  }, [selected])

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setQuery('')
    setSuggestions([])
    setSelected([])
    setResults([])
    setShowDrop(false)
  }

  const addIngredient = (ing: IngredientResult) => {
    if (!selected.find(s => s.id === ing.id)) setSelected(prev => [...prev, ing])
    setQuery('')
    setSuggestions([])
    setShowDrop(false)
    inputRef.current?.focus()
  }

  const removeIngredient = (id: string) =>
    setSelected(prev => prev.filter(s => s.id !== id))

  return (
    <>
      <nav
        ref={panelRef}
        className={`
          fixed top-0 left-0 right-0 z-[100]
          border-b border-[#1e3328]
          backdrop-blur-[10px]
          transition-all duration-300
          ${scrolled
            ? 'bg-[rgba(10,21,16,0.97)]'
            : 'bg-[rgba(10,21,16,0.85)]'
          }
        `}
      >
        {/* ── main bar ── */}
        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'px-5 md:px-10 py-2 md:py-2.5' : 'px-5 md:px-10 py-2.5 md:py-4'}`}>

          {/* Logo — hidden on mobile when search is open */}
          <Link href="/" className={`flex items-center flex-shrink-0 transition-all duration-200 ${searchOpen ? 'opacity-0 pointer-events-none w-0 md:opacity-100 md:pointer-events-auto md:w-auto' : ''}`}>
            <Image src="/logo.jpeg" alt="FlavorFind" width={36} height={36} className="rounded-xl object-contain md:w-11 md:h-11" priority />
          </Link>

          {/* Nav links — desktop only */}
          <ul className={`hidden md:flex gap-9 text-[0.9rem] text-[#8a9e92] transition-all duration-300 ${searchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {NAV_LINKS.map(link => (
              <li key={link.label}>
                <a href={link.href} className="transition-colors duration-200 hover:text-[#e8e2d4]">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* ── Mobile inline search bar (same row as logo) ── */}
          {searchOpen && (
            <div className="flex md:hidden flex-1 mx-3">
              <div
                className={`flex items-center gap-2 bg-[#152a1e] border rounded-[40px] px-4 py-2 w-full transition-colors duration-200 ${showDrop ? 'border-[#e3c477]' : 'border-[#1e3328]'}`}
                onClick={() => inputRef.current?.focus()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a9e92" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
                </svg>
                <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                  {selected.map(s => (
                    <span key={s.id} className="flex items-center gap-1 bg-[rgba(227,196,119,0.15)] border border-[#e3c477]/50 text-[#e3c477] text-[0.7rem] px-2 py-0.5 rounded-full whitespace-nowrap">
                      {s.name}
                      <button onClick={() => removeIngredient(s.id)} className="text-[#e3c477]/60 hover:text-[#e3c477] leading-none">✕</button>
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
                      if (e.key === 'Escape') closeSearch()
                      if (e.key === 'Backspace' && !query && selected.length > 0)
                        removeIngredient(selected[selected.length - 1].id)
                    }}
                    placeholder={selected.length === 0 ? "Type ingredient…" : "Add more…"}
                    className="flex-1 bg-transparent border-none outline-none text-[#e8e2d4] text-[0.82rem] placeholder:text-[#8a9e92] min-w-[80px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search button / close */}
          {!searchOpen ? (
            <button
              onClick={openSearch}
              className="
                bg-[#d2622c] text-white text-[0.85rem] tracking-[0.03em]
                px-3 py-2.5 md:px-6 md:py-[11px] rounded-full border-none cursor-pointer
                transition-all duration-200 flex items-center gap-2
                hover:bg-[#e0703a] hover:-translate-y-px hover:shadow-[0_10px_26px_rgba(210,98,44,0.35)]
                active:scale-[0.97]
              "
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>
              {/* Text hidden on mobile */}
              <span className="hidden md:inline">Search Recipes</span>
            </button>
          ) : (
            <button
              onClick={closeSearch}
              className="text-[#8a9e92] hover:text-[#e8e2d4] transition-colors text-[0.85rem] flex items-center gap-1.5 flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              <span className="hidden md:inline">Close</span>
            </button>
          )}
        </div>

        {/* ── expanded search bar — desktop only ── */}
        <div
          className="hidden md:block overflow-hidden transition-all duration-400"
          style={{ maxHeight: searchOpen ? '80px' : '0px', opacity: searchOpen ? 1 : 0 }}
        >
          <div className="px-10 pb-4">
            <div
              className={`flex items-center gap-3 bg-[#152a1e] border rounded-[40px] px-5 py-3 transition-colors duration-200 ${showDrop ? 'border-[#e3c477]' : 'border-[#1e3328]'}`}
              onClick={() => inputRef.current?.focus()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a9e92" strokeWidth="2" className="flex-shrink-0">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {selected.map(s => (
                  <span key={s.id} className="flex items-center gap-1 bg-[rgba(227,196,119,0.15)] border border-[#e3c477]/50 text-[#e3c477] text-[0.75rem] px-3 py-1 rounded-full whitespace-nowrap">
                    {s.name}
                    <button onClick={() => removeIngredient(s.id)} className="text-[#e3c477]/60 hover:text-[#e3c477] ml-0.5 leading-none">✕</button>
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
                    if (e.key === 'Escape') closeSearch()
                    if (e.key === 'Backspace' && !query && selected.length > 0)
                      removeIngredient(selected[selected.length - 1].id)
                  }}
                  placeholder={selected.length === 0 ? "Type an ingredient — e.g. chicken, garlic…" : "Add another…"}
                  className="flex-1 bg-transparent border-none outline-none text-[#e8e2d4] text-[0.9rem] placeholder:text-[#8a9e92] min-w-[140px]"
                />
              </div>
              {loadingSug && <span className="text-[11px] text-[#8a9e92] animate-pulse flex-shrink-0">…</span>}
              {selected.length > 0 && (
                <span className="text-[0.75rem] text-[#8a9e92] flex-shrink-0">
                  {loadingRes ? 'Searching…' : `${results.length} recipes`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── autocomplete dropdown ── */}
        {searchOpen && showDrop && suggestions.length > 0 && (
          <div className="absolute left-5 right-5 md:left-10 md:right-10 top-full mt-1 bg-[#152a1e] border border-[#1e3328] rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.5)] z-50">
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                onMouseDown={() => addIngredient(s)}
                className={`w-full flex items-center justify-between px-5 py-3 text-[0.88rem] text-[#e8e2d4] hover:bg-[#1e3328] transition-colors text-left ${i !== 0 ? 'border-t border-[#1e3328]' : ''}`}
              >
                <span className="font-medium capitalize">{s.name}</span>
                <span className="text-[0.75rem] text-[#8a9e92]">{s.recipe_count.toLocaleString()} recipes</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ── results panel (below nav, full width overlay) ── */}
      {searchOpen && results.length > 0 && (
        <div className="fixed left-0 right-0 z-[99] bg-[rgba(10,21,16,0.98)] border-b border-[#1e3328] backdrop-blur-xl"
          style={{ top: typeof window !== 'undefined' && window.innerWidth < 768 ? '56px' : '130px' }}
        >
          <div className="max-w-[1300px] mx-auto px-10 py-6">
            <p className="eyebrow mb-5">
              {results.length} recipes matched
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {results.map(recipe => (
                <a
                  key={recipe.id}
                  href={`https://flavorfind.co.ke/recipes/${recipe.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-[#152a1e] border border-[#1e3328] rounded-xl overflow-hidden hover:border-[#e3c477] transition-colors duration-200"
                >
                  {/* image */}
                  <div className="relative w-full h-[120px] bg-[#1e3328]">
                    <Image
                      src={getRecipeImage(recipe)}
                      alt={recipe.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="250px"
                    />
                    {recipe.total_time && (
                      <span className="absolute top-2 left-2 bg-[rgba(10,21,16,0.8)] text-[#e3c477] text-[0.65rem] px-2 py-0.5 rounded-full">
                        {parseDuration(recipe.total_time)}
                      </span>
                    )}
                  </div>
                  {/* body */}
                  <div className="p-3">
                    <p className="text-[#e8e2d4] text-[0.8rem] font-medium leading-snug line-clamp-2">{recipe.name}</p>
                    {recipe.category && (
                      <p className="text-[#8a9e92] text-[0.7rem] mt-1">{recipe.category}</p>
                    )}
                    {recipe.rating && (
                      <p className="text-[#e3c477] text-[0.7rem] mt-1">★ {Number(recipe.rating).toFixed(1)}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
