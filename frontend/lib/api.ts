const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://flavorfind-22iw.onrender.com/api/v1'

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
  source_id?: number
  image_url?: string | null
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
  images: RecipeImage[]
  chef_note?: string
}

export interface RecipeIngredient {
  id: string
  name: string
  category: string
  quantity: string
  quantity_numeric: number | null
  unit: string | null
  sort_order: number
}

export interface RecipeImage {
  url: string
  sort_order: number
}

export interface DailyPick extends RecipeDetail {
  pick_date: string
}

export interface WeeklyFeature extends RecipeDetail {
  week_start: string
  week_end: string
  story: string
  video_url: string | null
}

export interface CategoryEntry {
  category: string
  recipe_count: number
}

export interface EnrichedCategory {
  name: string
  slug: string
  recipe_count: number
  description: string | null
  image_url: string | null
  accent_color: string | null
  sort_order: number
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

export interface EnrichedCategoriesResult {
  categories: EnrichedCategory[]
  count: number
}

export interface TrendingResult {
  results: Recipe[]
  pagination: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface FreshPicksResult {
  results: Recipe[]
  count: number
}

// ─── Ingredient API calls ─────────────────────────────────────────────────────

export async function searchIngredients(q: string, limit = 8): Promise<IngredientSearchResult> {
  return get<IngredientSearchResult>('/ingredients/search', { q, limit })
}

// ─── Recipe search API calls ──────────────────────────────────────────────────

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

// ─── Discovery API calls ──────────────────────────────────────────────────────

/** GET /v1/recipes/trending — ordered by source_id DESC, paginated */
export async function getTrendingRecipes(limit = 12, page = 1): Promise<TrendingResult> {
  return get<TrendingResult>('/recipes/trending', { limit, page })
}

/** GET /v1/recipes/daily-pick — deterministic pick of the day */
export async function getDailyPick(): Promise<DailyPick> {
  return get<DailyPick>('/recipes/daily-pick')
}

/** GET /v1/recipes/weekly-feature — deterministic pick of the week */
export async function getWeeklyFeature(): Promise<WeeklyFeature> {
  return get<WeeklyFeature>('/recipes/weekly-feature')
}

/** GET /v1/recipes/featured — featured dish, rotates weekly */
export async function getFeaturedDish(): Promise<RecipeDetail> {
  return get<RecipeDetail>('/recipes/featured')
}

/** GET /v1/recipes/fresh-picks — 6 recipes spread across categories */
export async function getFreshPicks(): Promise<FreshPicksResult> {
  return get<FreshPicksResult>('/recipes/fresh-picks')
}

/** GET /v1/recipes/by-category — paginated list filtered by category */
export async function getByCategory(
  category: string,
  opts?: { limit?: number; page?: number }
): Promise<TrendingResult> {
  return get<TrendingResult>('/recipes/by-category', {
    category,
    limit: opts?.limit ?? 12,
    page: opts?.page ?? 1,
  })
}

/** GET /v1/categories — enriched categories with metadata */
export async function getEnrichedCategories(): Promise<EnrichedCategoriesResult> {
  return get<EnrichedCategoriesResult>('/categories')
}

/** GET /v1/recipes/{id} — full recipe detail */
export async function getRecipe(id: string): Promise<RecipeDetail> {
  return get<RecipeDetail>(`/recipes/${id}`)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function parseIsoMinutes(iso: string | null | undefined): number | null {
  if (!iso) return null
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return null
  return (parseInt(m[1] ?? '0') * 60) + parseInt(m[2] ?? '0')
}

export function parseDuration(iso: string | null | undefined): string {
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
  Sides:     'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
  Stew:      'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  Beverages: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80',
  African:   'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80',
  default:   'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
}

export function getRecipeImage(recipe: Pick<Recipe, 'image_url' | 'category'>): string {
  if (recipe.image_url) return recipe.image_url
  const cat = recipe.category ?? ''
  for (const key of Object.keys(CATEGORY_FALLBACK)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return CATEGORY_FALLBACK[key]
  }
  return CATEGORY_FALLBACK.default
}
