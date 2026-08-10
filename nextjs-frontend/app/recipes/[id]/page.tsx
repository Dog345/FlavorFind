import Link from 'next/link';
import { notFound } from 'next/navigation';
import RecipeImage from '@/components/RecipeImage';

interface Step { number: number; step: string; }
interface Ingredient { original: string; }
interface Recipe {
  id: number; title: string; image: string;
  readyInMinutes?: number; servings?: number; likes?: number;
  summary?: string; cuisines?: string[]; diets?: string[]; dishTypes?: string[];
  extendedIngredients?: Ingredient[];
  analyzedInstructions?: { steps: Step[] }[];
  instructions?: string; // Database format: plain text instructions
  ingredients?: { list: string[] }; // Database format: ingredients object
  nutrition?: { nutrients: { name: string; amount: number; unit: string }[] };
  sourceUrl?: string; sourceName?: string;
  veryHealthy?: boolean; veryPopular?: boolean;
}

function parseInstructions(recipe: Recipe): Step[] {
  // Check for old format (analyzedInstructions)
  if (recipe.analyzedInstructions?.[0]?.steps) {
    return recipe.analyzedInstructions[0].steps;
  }
  
  // Check for database format (instructions as string)
  if (recipe.instructions && typeof recipe.instructions === 'string') {
    // Split by double newlines or numbered patterns
    const text = recipe.instructions.trim();
    const parts = text.split(/\n\n+/).filter(p => p.trim());
    return parts.map((part, idx) => ({
      number: idx + 1,
      step: part.trim()
    }));
  }
  
  return [];
}

async function getRecipe(id: string): Promise<Recipe> {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recipes/db/${id}`, { cache: 'no-store' });
  if (!r.ok) notFound();
  const data = await r.json();
  return data.data || data;
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  const steps = parseInstructions(recipe);
  const nutrients = recipe.nutrition?.nutrients?.slice(0, 6) ?? [];
  const summary = recipe.summary?.replace(/<[^>]*>/g, '') ?? '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111111' }}>
      {/* ── Hero Banner ── */}
      <div className="relative w-full overflow-hidden" style={{ height: '420px' }}>
        <RecipeImage src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111]/80 via-transparent to-transparent" />

        <div className="absolute top-6 left-6">
          <Link href="/recipes"
            className="flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-xl border border-white/10 hover:border-orange-500/50 transition-colors">
            <i className="fas fa-arrow-left text-xs"></i> Back to Recipes
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2 mb-3">
              {recipe.cuisines?.map(c => (
                <span key={c} className="bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs px-3 py-1 rounded-full">{c}</span>
              ))}
              {recipe.diets?.slice(0, 3).map(d => (
                <span key={d} className="bg-green-900/40 border border-green-700/40 text-green-400 text-xs px-3 py-1 rounded-full capitalize">{d}</span>
              ))}
              {recipe.veryPopular && <span className="bg-yellow-900/40 border border-yellow-700/40 text-yellow-400 text-xs px-3 py-1 rounded-full">🔥 Popular</span>}
              {recipe.veryHealthy && <span className="bg-emerald-900/40 border border-emerald-700/40 text-emerald-400 text-xs px-3 py-1 rounded-full">💚 Healthy</span>}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{recipe.title}</h1>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: 'fa-clock',    label: 'Cook Time',    value: recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : '—', color: 'text-orange-400' },
            { icon: 'fa-users',    label: 'Servings',     value: recipe.servings ? `${recipe.servings} people` : '—',          color: 'text-blue-400' },
            { icon: 'fa-heart',    label: 'Likes',        value: recipe.likes ? recipe.likes.toLocaleString() : '—',           color: 'text-red-400' },
            { icon: 'fa-utensils', label: 'Ingredients',  value: recipe.extendedIngredients ? `${recipe.extendedIngredients.length} items` : '—', color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="stat-card p-4 flex items-center gap-4">
              <div className={`text-2xl ${s.color}`}><i className={`fas ${s.icon}`}></i></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</p>
                <p className="font-bold text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Left column */}
          <div className="md:col-span-1 space-y-8">
            {summary && (
              <div>
                <h2 className="section-title mb-4">About</h2>
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{summary}</p>
              </div>
            )}

            {nutrients.length > 0 && (
              <div>
                <h2 className="section-title mb-4">Nutrition</h2>
                <div className="grid grid-cols-2 gap-3">
                  {nutrients.map(n => (
                    <div key={n.name} className="nutrition-badge">
                      <p className="text-lg font-bold text-orange-400">{Math.round(n.amount)}<span className="text-xs text-gray-500 ml-0.5">{n.unit}</span></p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(recipe.extendedIngredients?.length || recipe.ingredients?.list?.length) ? (
              <div>
                <h2 className="section-title mb-4">Ingredients</h2>
                <ul className="space-y-2">
                  {(recipe.extendedIngredients || recipe.ingredients?.list || [])
                    .map((ing, i) => {
                      const ingText = typeof ing === 'string' ? ing : ing.original;
                      return (
                        <li key={i} className="flex items-start gap-3 text-sm py-2 border-b border-[#1e1e1e] last:border-0">
                          <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></span>
                          <span className="text-gray-300">{ingText}</span>
                        </li>
                      );
                    })
                  }
                </ul>
              </div>
            ) : null}
          </div>

          {/* Right column — Instructions */}
          <div className="md:col-span-2">
            <h2 className="section-title mb-6">Instructions</h2>

            {steps.length > 0 ? (
              <ol className="space-y-6">
                {steps.map((s, idx) => (
                  <li key={s.number} className="flex gap-5 fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="step-num text-white">{s.number}</div>
                    <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                      <p className="text-gray-300 text-sm leading-relaxed">{s.step}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 text-center">
                <i className="fas fa-book-open text-4xl text-gray-600 mb-4 block"></i>
                <p className="text-gray-500">No step-by-step instructions available.</p>
              </div>
            )}

            {recipe.dishTypes && recipe.dishTypes.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Dish Types</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.dishTypes.map(d => (
                    <Link key={d} href={`/categories?type=type&value=${encodeURIComponent(d)}`}
                      className="cat-pill px-4 py-1.5 text-sm text-gray-300 capitalize">{d}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
