const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.flavorfind.co.ke/api/v1'

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

// Fetch a varied featured set using popular ingredients (chicken + pasta + beef + salmon)
export async function getFeaturedRecipes(limit = 8): Promise<Recipe[]> {
  const POPULAR_IDS = [
    '7bb3db1c-27bf-499e-9945-7ed92bdc16f5', // chicken
    '0f8783a7-f075-4e52-819f-80e73cb154a2', // pasta
    'c9ccce82-f99e-4673-9d28-2082f5bb9153', // beef
    'ed1ddb4f-ecfd-4300-8e88-e682d26a80cc', // salmon
  ]
  const res = await get<RecipeSearchResult>('/recipes/search', {
    ingredient_ids: POPULAR_IDS,
    limit,
  })
  return res.results
}

export async function getRecipe(id: string): Promise<RecipeDetail> {
  return get<RecipeDetail>(`/recipes/${id}`)
}
