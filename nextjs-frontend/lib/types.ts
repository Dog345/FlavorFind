export interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
  servings?: number;
  summary?: string;
  cuisines?: string[];
  diets?: string[];
  dishTypes?: string[];
  extendedIngredients?: { original: string }[];
  analyzedInstructions?: { steps: { number: number; step: string }[] }[];
  usedIngredientCount?: number;
  missedIngredientCount?: number;
  likes?: number;
}

export interface SearchResult {
  results: Recipe[];
  totalResults: number;
  offset: number;
  number: number;
}

export interface KeyStats {
  total: number;
  active: number;
  exhausted: number;
  detail: {
    index: number;
    requests_used: number;
    daily_limit: number;
    remaining: number;
    exhausted: boolean;
  }[];
}

export interface HealthResponse {
  status: string;
  service: string;
  keys: KeyStats;
  usage: {
    today: number;
    capacity: number;
    remaining: number;
    utilization: string;
  };
}

export interface Categories {
  cuisines: string[];
  diets: string[];
  meal_types: string[];
}
