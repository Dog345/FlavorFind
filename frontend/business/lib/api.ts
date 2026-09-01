const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.flavorfind.co.ke/api/v1'

async function get<T>(
  path: string,
  params?: Record<string, string | string[] | number | undefined>
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(`${key}[]`, v))
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }
  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IngredientResult {
  id: string
  name: string
  category: string
  recipe_count: number
}

export interface Recipe {
  id: string
  name: string
  category: string
  description: string
  prep_time: string | null
  cook_time: string | null
  total_time: string | null
  servings: number | null
  rating: string | null
  review_count: number
  calories: string | null
  image_url?: string | null
}

export interface CategoryEntry {
  category: string
  recipe_count: number
}

export interface RecipeSearchResult {
  mode: string
  results: Recipe[]
  pagination: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface IngredientSearchResult {
  query: string
  results: IngredientResult[]
  count: number
}

export interface CategoriesResult {
  categories: CategoryEntry[]
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function searchIngredients(q: string, limit = 8): Promise<IngredientSearchResult> {
  return get<IngredientSearchResult>('/ingredients/search', { q, limit })
}

export async function getCategories(): Promise<CategoriesResult> {
  return get<CategoriesResult>('/recipes/categories')
}

export async function searchRecipes(
  ingredientIds: string[],
  opts?: { limit?: number; page?: number; category?: string }
): Promise<RecipeSearchResult> {
  return get<RecipeSearchResult>('/recipes/search', {
    ingredient_ids: ingredientIds,
    limit: opts?.limit ?? 8,
    page: opts?.page,
    category: opts?.category,
  })
}

// Broad ingredient IDs that cover most of the recipe library
const BROAD_IDS = [
  '8bd94446-b88a-492f-95bc-74a44c2204b4', // salt
  '13ba49f1-6fd7-45b4-989d-f02456efdad5', // sugar
]

export async function getFeaturedRecipes(limit = 8): Promise<Recipe[]> {
  const res = await searchRecipes(BROAD_IDS, { limit })
  return res.results
}

/** Returns 4 recipes for the "What Everyone's Cooking" section. */
export async function getTrendingRecipes(limit = 4): Promise<Recipe[]> {
  const res = await searchRecipes(BROAD_IDS, { limit, page: 2 })
  return res.results
}

/** Returns up to 20 recipes for the auto-scrolling strip. */
export async function getStripRecipes(limit = 20): Promise<Recipe[]> {
  const res = await searchRecipes(BROAD_IDS, { limit, page: 1 })
  return res.results
}

export function parseIsoMinutes(iso: string | null | undefined): number | null {
  if (!iso) return null
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return null
  return (parseInt(m[1] ?? '0') * 60) + parseInt(m[2] ?? '0')
}

export function parseDuration(iso: string | null): string {
  if (!iso) return '—'
  const h = iso.match(/(\d+)H/)?.[1]
  const m = iso.match(/(\d+)M/)?.[1]
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  if (m) return `${m}m`
  return '—'
}

// Fallback images per recipe category
export const CATEGORY_FALLBACK: Record<string, string> = {
  Chicken:   'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=600&q=80',
  Dessert:   'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&q=80',
  Breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
  Pasta:     'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
  Seafood:   'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&q=80',
  Meat:      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  Vegetable: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  Soups:     'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  default:   'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
}

export function getRecipeImage(recipe: Recipe): string {
  if (recipe.image_url) return recipe.image_url
  const cat = recipe.category ?? ''
  for (const key of Object.keys(CATEGORY_FALLBACK)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return CATEGORY_FALLBACK[key]
  }
  return CATEGORY_FALLBACK.default
}
