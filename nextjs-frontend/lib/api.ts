import { Recipe, SearchResult, HealthResponse, Categories } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL;

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: ()                                          => get<HealthResponse>('/api/health'),
  categories: ()                                      => get<Categories>('/api/categories'),
  findByIngredients: (ingredients: string, number = 12) =>
    get<Recipe[]>('/api/recipes', { ingredients, number: String(number) }),
  search: (params: Record<string, string>)            => get<SearchResult>('/api/recipes/search', params),
  random: (number = 10, tags?: string)                =>
    get<{ recipes: Recipe[] }>('/api/recipes/random', { number: String(number), ...(tags ? { tags } : {}) }),
  recipeById: (id: number)                            => get<Recipe>(`/api/recipes/${id}`),
  byCuisine: (cuisine: string, number = 12)           =>
    get<SearchResult>(`/api/categories/cuisine/${encodeURIComponent(cuisine)}`, { number: String(number) }),
  byDiet: (diet: string, number = 12)                 =>
    get<SearchResult>(`/api/categories/diet/${encodeURIComponent(diet)}`, { number: String(number) }),
  byType: (type: string, number = 12)                 =>
    get<SearchResult>(`/api/categories/type/${encodeURIComponent(type)}`, { number: String(number) }),
  autocomplete: (query: string)                       =>
    get<{ name: string; image: string }[]>('/api/ingredients/autocomplete', { query }),
};
