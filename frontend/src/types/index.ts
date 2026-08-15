export interface Ingredient {
  id: string
  name: string
  category: string
  recipe_count?: number
  has_embedding?: boolean
}

export interface IngredientWithCount extends Ingredient {
  recipe_count: number
}

export interface Suggestion extends Ingredient {
  score: number
  co_occurrence_score: number
  vector_score: number
  rank?: number
}

export interface MultiSuggestion {
  id: string
  name: string
  category: string
  anchor_matches: number
  avg_score: number
  final_score: number
}

export interface Recipe {
  id: string
  name: string
  description: string
  instructions: string
  servings?: number
  prep_time?: number
  cook_time?: number
  total_time?: number
  rating?: number
  image_url?: string
  source_url?: string
  ingredients: RecipeIngredient[]
}

export interface RecipeIngredient {
  ingredient_id: string
  ingredient_name: string
  amount: string
  unit: string
}

export interface SearchParams {
  ingredient_ids: string[]
  mode?: 'any' | 'all'
  category?: string
  min_rating?: number
  max_calories?: number
  q?: string
  limit?: number
  page?: number
}

export interface ApiResponse<T> {
  data: T
  count?: number
  error?: string
}
