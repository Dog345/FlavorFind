const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://flavorfind-22iw.onrender.com/api/v1'

async function get<T>(path: string, params?: Record<string, string | string[] | number | undefined>): Promise<T> {
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
  const res = await fetch(url.toString(), { next: { revalidate: 60 } })
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
  matched_count?: number
  total_searched?: number
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

export interface RecipeIngredient {
  id: string
  name: string
  category: string
  quantity: string | null
  unit: string | null
}

export interface RecipeDetail extends Recipe {
  yield: string | null
  instructions: string[]
  keywords: string[]
  protein_g: string | null
  fat_g: string | null
  carbs_g: string | null
  fiber_g: string | null
  sugar_g: string | null
  cholesterol_mg: string | null
  sodium_mg: string | null
  saturated_fat_g: string | null
  ingredients: RecipeIngredient[]
  images?: { url: string; sort_order: number }[]
}

// ─── API calls ────────────────────────────────────────────────────────────────

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

export async function searchIngredients(q: string, limit = 8): Promise<IngredientSearchResult> {
  return get<IngredientSearchResult>('/ingredients/search', { q, limit })
}

export async function getCategories(): Promise<CategoriesResult> {
  return get<CategoriesResult>('/recipes/categories')
}

// Fetch a varied featured set by searching across the two broadest ingredients in the DB
// (salt matches 47 recipes, sugar matches 11 — together they cover 57 of the 85 seeded recipes)
export async function getFeaturedRecipes(limit = 8): Promise<Recipe[]> {
  const res = await get<RecipeSearchResult>('/recipes/search', {
    ingredient_ids: [
      '8bd94446-b88a-492f-95bc-74a44c2204b4', // salt  — matches 47 seeded recipes
      '13ba49f1-6fd7-45b4-989d-f02456efdad5', // sugar — matches 11 seeded recipes
    ],
    limit,
  })
  return res.results
}

export async function getRecipe(id: string): Promise<RecipeDetail> {
  return get<RecipeDetail>(`/recipes/${id}`)
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Parse ISO 8601 duration (e.g. "PT1H20M") into total minutes. Returns null if unparseable. */
export function parseIsoMinutes(iso: string | null | undefined): number | null {
  if (!iso) return null
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return null
  return (parseInt(m[1] ?? '0') * 60) + parseInt(m[2] ?? '0')
}

/** Fetch recipes with a total_time under 60 minutes. Fetches across pages then filters client-side. */
export async function getQuickRecipes(limit = 8): Promise<Recipe[]> {
  const BROAD_IDS = [
    '8bd94446-b88a-492f-95bc-74a44c2204b4', // salt  — matches 47 seeded recipes
    '13ba49f1-6fd7-45b4-989d-f02456efdad5', // sugar — matches 11 seeded recipes
  ]
  // API max per page is 50 — fetch page 1 and 2 to cover all 57 matches
  const [page1, page2] = await Promise.all([
    get<RecipeSearchResult>('/recipes/search', { ingredient_ids: BROAD_IDS, limit: 50, page: 1 }),
    get<RecipeSearchResult>('/recipes/search', { ingredient_ids: BROAD_IDS, limit: 50, page: 2 }),
  ])
  const all = [...page1.results, ...page2.results]
  // Deduplicate by id
  const seen = new Set<string>()
  const unique = all.filter(r => seen.has(r.id) ? false : (seen.add(r.id), true))

  return unique
    .filter(r => {
      const mins = parseIsoMinutes(r.total_time)
      return mins !== null && mins < 60
    })
    .slice(0, limit)
}
