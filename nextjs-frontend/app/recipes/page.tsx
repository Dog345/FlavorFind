import RecipeCard from '@/components/RecipeCard';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';

interface Props {
  searchParams: Promise<{ ingredients?: string; query?: string; cuisine?: string; diet?: string; type?: string }>;
}

async function fetchRecipes(params: Awaited<Props['searchParams']>) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const { ingredients, query, cuisine, diet, type } = params;

  if (ingredients) {
    const r = await fetch(`${base}/api/recipes?ingredients=${encodeURIComponent(ingredients)}&number=20`, { cache: 'no-store' });
    if (!r.ok) throw new Error((await r.json()).error || 'API error');
    const data = await r.json();
    return { recipes: data, total: data.length, heading: `Results for "${ingredients}"`, sub: `${data.length} recipes matched your ingredients` };
  }
  if (query || cuisine || diet || type) {
    const p = new URLSearchParams();
    if (query)   p.set('query', query);
    if (cuisine) p.set('cuisine', cuisine);
    if (diet)    p.set('diet', diet);
    if (type)    p.set('type', type);
    p.set('number', '20');
    const r = await fetch(`${base}/api/recipes/search?${p}`, { cache: 'no-store' });
    if (!r.ok) throw new Error((await r.json()).error || 'API error');
    const data = await r.json();
    const label = query ? `"${query}"` : cuisine || diet || type;
    return { recipes: data.results, total: data.totalResults, heading: `Results for ${label}`, sub: `${data.totalResults} total recipes found` };
  }
  const r = await fetch(`${base}/api/recipes/random?number=20`, { next: { revalidate: 3600 } });
  if (!r.ok) throw new Error('API error');
  const data = await r.json();
  return { recipes: data.recipes, total: data.recipes.length, heading: 'Discover Recipes', sub: 'Fresh picks updated hourly' };
}

export default async function RecipesPage({ searchParams }: Props) {
  const params = await searchParams;
  let recipes: any[] = [], total = 0, heading = 'All Recipes', sub = '', error = '';

  try {
    ({ recipes, total, heading, sub } = await fetchRecipes(params));
  } catch (e: any) { error = e.message; }

  const hasSearch = !!(params.ingredients || params.query || params.cuisine || params.diet || params.type);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Search panel */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 mb-10">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <i className="fas fa-search text-orange-500"></i> Search Recipes
        </h2>
        <SearchBar />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">{heading}</h1>
          {sub && <p className="text-gray-500 text-sm mt-2">{sub}</p>}
        </div>
        {hasSearch && (
          <Link href="/recipes" className="btn-ghost px-4 py-2 text-sm flex items-center gap-2 self-start">
            <i className="fas fa-times text-xs"></i> Clear Search
          </Link>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { label: '🌍 Italian',     href: '/recipes?cuisine=italian' },
          { label: '🌶️ Mexican',    href: '/recipes?cuisine=mexican' },
          { label: '🥗 Vegetarian', href: '/recipes?diet=vegetarian' },
          { label: '🔥 Ketogenic',  href: '/recipes?diet=ketogenic' },
          { label: '🍳 Breakfast',  href: '/recipes?type=breakfast' },
          { label: '🍰 Desserts',   href: '/recipes?type=dessert' },
        ].map(f => (
          <Link key={f.label} href={f.href} className="cat-pill text-xs text-gray-400 px-3 py-1.5">{f.label}</Link>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-400 text-sm mb-8 flex items-center gap-3">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      )}

      {recipes.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {recipes.map((r: any, i: number) => (
            <div key={r.id} className="fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
              <RecipeCard recipe={r} />
            </div>
          ))}
        </div>
      ) : !error && (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-search text-3xl text-gray-600"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-400 mb-2">No recipes yet</h3>
          <p className="text-gray-600 text-sm">Enter some ingredients above to find matching recipes</p>
        </div>
      )}
    </div>
  );
}
