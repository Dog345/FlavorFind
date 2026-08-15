'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { searchIngredients, searchRecipes, type IngredientResult, type Recipe } from '@/src/lib/api'
import { SearchIcon } from './Icons'
import RecipeCard from './RecipeCard'

const QUICK_TAGS = ['Chicken', 'Pasta', 'Salmon', 'Eggs', 'Rice', 'Beef', 'Mushrooms', 'Tomato']

interface Props {
  featured: Recipe[]
}

export default function SearchBar({ featured }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<IngredientResult[]>([])
  const [selected, setSelected] = useState<IngredientResult[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Which cards to show: search results when active, otherwise featured
  const isSearchActive = selected.length > 0
  const displayRecipes = isSearchActive ? recipes : featured

  // Autocomplete ingredients
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

  const fetchRecipes = useCallback(async (ingredients: IngredientResult[]) => {
    if (ingredients.length === 0) { setRecipes([]); setTotal(0); return }
    setLoadingRecipes(true)
    try {
      const res = await searchRecipes(ingredients.map(i => i.id), { limit: 8 })
      setRecipes(res.results)
      setTotal(res.pagination.total)
    } catch { setRecipes([]) }
    finally { setLoadingRecipes(false) }
  }, [])

  const addIngredient = (ing: IngredientResult) => {
    const next = [...selected, ing]
    setSelected(next)
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    fetchRecipes(next)
  }

  const removeIngredient = (id: string) => {
    const next = selected.filter(i => i.id !== id)
    setSelected(next)
    fetchRecipes(next)
  }

  const handleQuickTag = async (tag: string) => {
    if (selected.find(s => s.name.toLowerCase() === tag.toLowerCase())) return
    try {
      const res = await searchIngredients(tag, 1)
      if (res.results.length > 0) addIngredient(res.results[0])
    } catch { /* ignore */ }
  }

  return (
    <div>
      {/* Search input */}
      <div className="relative max-w-[580px] mx-auto mb-5">
        <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3.5 shadow-[0_4px_20px_-6px_rgba(18,51,38,0.18)] border border-cream-2">
          <SearchIcon className="h-4 w-4 stroke-ink-soft flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Type an ingredient, e.g. chicken…"
            className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-soft outline-none"
          />
          {loading && <span className="text-[11px] text-ink-soft animate-pulse">Searching…</span>}
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-cream-2 shadow-card overflow-hidden z-50">
            {suggestions.slice(0, 6).map(s => (
              <li key={s.id}>
                <button
                  onMouseDown={() => addIngredient(s)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13px] text-ink hover:bg-cream-2 transition-colors"
                >
                  <span>{s.name}</span>
                  <span className="text-[11px] text-ink-soft">{s.recipe_count.toLocaleString()} recipes</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected ingredient pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {selected.map(ing => (
            <span
              key={ing.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-green-deep text-white px-3.5 py-1.5 text-[12.5px] font-medium"
            >
              {ing.name}
              <button
                onClick={() => removeIngredient(ing.id)}
                className="ml-0.5 text-white/60 hover:text-white text-[14px] leading-none"
                aria-label={`Remove ${ing.name}`}
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={() => { setSelected([]); setRecipes([]); setTotal(0) }}
            className="text-[12px] text-ink-soft hover:text-terracotta transition-colors underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Quick tags */}
      <div className="flex flex-wrap justify-center gap-2.5 mb-12">
        {QUICK_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => handleQuickTag(tag)}
            disabled={!!selected.find(s => s.name.toLowerCase() === tag.toLowerCase())}
            className="rounded-full border border-green-deep/20 bg-white px-4 py-1.5 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Loading spinner */}
      {loadingRecipes && (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 rounded-full border-4 border-cream-2 border-t-terracotta animate-spin" />
        </div>
      )}

      {/* Recipe grid — featured by default, search results when active */}
      {!loadingRecipes && displayRecipes.length > 0 && (
        <div>
          {isSearchActive && (
            <p className="mb-6 text-[13.5px] text-ink-soft text-center">
              Showing <strong className="text-green-deep">{recipes.length}</strong> of{' '}
              <strong className="text-green-deep">{total.toLocaleString()}</strong> recipes
            </p>
          )}
          <div className="grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-4">
            {displayRecipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        </div>
      )}

      {/* No results state */}
      {!loadingRecipes && isSearchActive && recipes.length === 0 && (
        <p className="text-center text-[14px] text-ink-soft py-10">
          No recipes found for those ingredients. Try a different combination.
        </p>
      )}
    </div>
  )
}
