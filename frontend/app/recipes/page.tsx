'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { searchIngredients, searchRecipes, getCategories, type IngredientResult, type Recipe } from '@/src/lib/api'
import { SearchIcon } from '@/components/Icons'
import RecipeCard from '@/components/RecipeCard'
import Navbar from '@/components/Navbar'

const QUICK_TAGS = ['Chicken', 'Pasta', 'Beef', 'Salmon', 'Eggs', 'Rice', 'Mushrooms', 'Tomato', 'Broccoli', 'Shrimp']

export default function RecipesPage() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') ?? ''
  const initialIngNames = searchParams.getAll('ing') // from hero search

  const [query, setQuery]               = useState('')
  const [suggestions, setSuggestions]   = useState<IngredientResult[]>([])
  const [selected, setSelected]         = useState<IngredientResult[]>([])
  const [category, setCategory]         = useState(initialCategory)
  const [categories, setCategories]     = useState<{ category: string; recipe_count: number }[]>([])
  const [recipes, setRecipes]           = useState<Recipe[]>([])
  const [total, setTotal]               = useState(0)
  const [page, setPage]                 = useState(1)
  const [loading, setLoading]           = useState(false)
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [initialised, setInitialised]   = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load categories on mount
  useEffect(() => {
    getCategories().then(d => setCategories(d.categories.slice(0, 20))).catch(() => {})
  }, [])

  // Resolve any ?ing= names passed from the hero search bar into real ingredient objects
  useEffect(() => {
    if (initialised) return
    if (initialIngNames.length === 0) { setInitialised(true); return }
    const resolve = async () => {
      const resolved: IngredientResult[] = []
      for (const name of initialIngNames) {
        try {
          const res = await searchIngredients(name, 1)
          if (res.results.length > 0) resolved.push(res.results[0])
        } catch { /* skip */ }
      }
      if (resolved.length > 0) {
        setSelected(resolved)
        fetchRecipes(resolved, initialCategory, 1)
      }
      setInitialised(true)
    }
    resolve()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autocomplete
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchIngredients(query)
        setSuggestions(res.results.filter(r => !selected.find(s => s.id === r.id)))
      } catch { setSuggestions([]) }
      finally { setLoading(false) }
    }, 300)
  }, [query, selected])

  // Fetch recipes whenever ingredients, category or page changes
  const fetchRecipes = useCallback(async (
    ingredients: IngredientResult[],
    cat: string,
    pg: number
  ) => {
    // Need at least one ingredient to search
    if (ingredients.length === 0) {
      // If category set, use a broad ingredient set
      const ids = cat
        ? ['7bb3db1c-27bf-499e-9945-7ed92bdc16f5',
           '0f8783a7-f075-4e52-819f-80e73cb154a2',
           'c9ccce82-f99e-4673-9d28-2082f5bb9153',
           'ed1ddb4f-ecfd-4300-8e88-e682d26a80cc']
        : ['7bb3db1c-27bf-499e-9945-7ed92bdc16f5',
           '0f8783a7-f075-4e52-819f-80e73cb154a2',
           'c9ccce82-f99e-4673-9d28-2082f5bb9153',
           'ed1ddb4f-ecfd-4300-8e88-e682d26a80cc']
      setLoadingRecipes(true)
      try {
        const res = await searchRecipes(ids, { limit: 12, page: pg, category: cat || undefined })
        setRecipes(res.results)
        setTotal(res.pagination.total)
      } catch { setRecipes([]) }
      finally { setLoadingRecipes(false) }
      return
    }
    setLoadingRecipes(true)
    try {
      const res = await searchRecipes(ingredients.map(i => i.id), { limit: 12, page: pg, category: cat || undefined })
      setRecipes(res.results)
      setTotal(res.pagination.total)
    } catch { setRecipes([]) }
    finally { setLoadingRecipes(false) }
  }, [])

  // Load on category/page changes, but only after ingredient init is done
  useEffect(() => {
    if (!initialised) return
    fetchRecipes(selected, category, page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, page, initialised])

  const addIngredient = (ing: IngredientResult) => {
    const next = [...selected, ing]
    setSelected(next)
    setQuery(''); setSuggestions([]); setShowSuggestions(false)
    setPage(1)
    fetchRecipes(next, category, 1)
  }

  const removeIngredient = (id: string) => {
    const next = selected.filter(i => i.id !== id)
    setSelected(next)
    setPage(1)
    fetchRecipes(next, category, 1)
  }

  const handleQuickTag = async (tag: string) => {
    if (selected.find(s => s.name.toLowerCase() === tag.toLowerCase())) return
    try {
      const res = await searchIngredients(tag, 1)
      if (res.results.length > 0) addIngredient(res.results[0])
    } catch { /* ignore */ }
  }

  const handleCategory = (cat: string) => {
    setCategory(prev => prev === cat ? '' : cat)
    setPage(1)
  }

  const totalPages = Math.ceil(total / 12)

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Page header ── */}
      <div className="bg-gradient-to-b from-green-deep to-green-deeper px-6 py-12 text-center">
        <div className="eyebrow justify-center !text-gold-light">
          Browse Recipes
        </div>
        <h1 className="font-display text-[32px] text-white md:text-[42px]">
          Find Your Next Favourite Dish
        </h1>
        <p className="mx-auto mt-3 max-w-[480px] text-[14px] leading-[1.7] text-white/60">
          Search by ingredient, filter by category, and discover thousands of recipes.
        </p>

        {/* Search bar */}
        <div className="relative mx-auto mt-8 max-w-[560px]">
          <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)]">
            <SearchIcon className="h-4 w-4 stroke-ink-soft flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Type an ingredient, e.g. chicken…"
              className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-soft outline-none"
            />
            {loading && <span className="text-[11px] text-ink-soft animate-pulse">…</span>}
          </div>
          {/* Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-cream-2 shadow-card overflow-hidden z-50 text-left">
              {suggestions.slice(0, 6).map(s => (
                <li key={s.id}>
                  <button
                    onMouseDown={() => addIngredient(s)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] text-ink hover:bg-cream-2 transition-colors"
                  >
                    <span>{s.name}</span>
                    <span className="text-[11px] text-ink-soft">{s.recipe_count.toLocaleString()} recipes</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected pills */}
        {selected.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {selected.map(ing => (
              <span key={ing.id} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 text-white px-3.5 py-1.5 text-[12.5px] font-medium">
                {ing.name}
                <button onClick={() => removeIngredient(ing.id)} className="ml-0.5 text-white/60 hover:text-white text-[14px]">×</button>
              </span>
            ))}
            <button onClick={() => { setSelected([]); setPage(1); fetchRecipes([], category, 1) }} className="text-[12px] text-white/50 hover:text-white underline">
              Clear all
            </button>
          </div>
        )}

        {/* Quick tags */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {QUICK_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => handleQuickTag(tag)}
              disabled={!!selected.find(s => s.name.toLowerCase() === tag.toLowerCase())}
              className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[12.5px] text-white hover:bg-white/20 transition-colors disabled:opacity-40"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main ── */}
      <div className="mx-auto max-w-[1240px] px-6 py-10 md:px-8">

        {/* Category filter chips */}
        {categories.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Filter by Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.category}
                  onClick={() => handleCategory(cat.category)}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors border ${
                    category === cat.category
                      ? 'bg-green-deep text-white border-green-deep'
                      : 'bg-white text-green-deep border-green-deep/20 hover:bg-green-deep hover:text-white'
                  }`}
                >
                  {cat.category}
                  <span className="ml-1.5 text-[11px] opacity-60">{cat.recipe_count.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        {!loadingRecipes && total > 0 && (
          <p className="mb-6 text-[13.5px] text-ink-soft">
            Showing <strong className="text-green-deep">{recipes.length}</strong> of{' '}
            <strong className="text-green-deep">{total.toLocaleString()}</strong> recipes
            {category && <span> in <strong className="text-terracotta">{category}</strong></span>}
          </p>
        )}

        {/* Loading */}
        {loadingRecipes && (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-cream-2 border-t-terracotta animate-spin" />
          </div>
        )}

        {/* Recipe grid */}
        {!loadingRecipes && recipes.length > 0 && (
          <div className="grid grid-cols-2 gap-[22px] md:grid-cols-3 lg:grid-cols-4">
            {recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        )}

        {/* No results */}
        {!loadingRecipes && recipes.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-[16px] text-ink-soft">No recipes found. Try different ingredients or category.</p>
          </div>
        )}

        {/* Pagination */}
        {!loadingRecipes && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-green-deep/20 px-5 py-2 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="px-4 text-[13px] text-ink-soft">
              Page {page} of {totalPages.toLocaleString()}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full border border-green-deep/20 px-5 py-2 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
