import SearchBar from '@/components/SearchBar';
import RecipeCard from '@/components/RecipeCard';
import Link from 'next/link';

const CUISINE_IMAGES: Record<string, string> = {
  Italian:       'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
  Mexican:       'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
  Asian:         'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80',
  African:       'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80',
  American:      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  French:        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  Mediterranean: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  Indian:        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  Japanese:      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80',
  Chinese:       'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80',
  Greek:         'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  Spanish:       'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600&q=80',
  Thai:          'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=600&q=80',
  Korean:        'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&q=80',
  Vietnamese:    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&q=80',
  Caribbean:     'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  German:        'https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=600&q=80',
  British:       'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80';

async function getDataWrapper() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const [randomRes, featuredRes, categoriesRes, healthRes] = await Promise.allSettled([
    fetch(`${base}/api/recipes/random?number=8`,                          { next: { revalidate: 3600 } }),
    fetch(`${base}/api/recipes/random?number=6`,                          { next: { revalidate: 7200 } }),
    fetch(`${base}/api/categories`,                                        { next: { revalidate: 86400 } }),
    fetch(`${base}/api/health`,                                            { next: { revalidate: 300 } }),
  ]);

  const recipes    = randomRes.status    === 'fulfilled' && randomRes.value.ok    ? (await randomRes.value.json()).recipes ?? []  : [];
  const featured   = featuredRes.status  === 'fulfilled' && featuredRes.value.ok  ? (await featuredRes.value.json()).recipes ?? [] : [];
  const categories = categoriesRes.status === 'fulfilled' && categoriesRes.value.ok ? await categoriesRes.value.json()             : { cuisines: [], diets: [], meal_types: [] };
  const health     = healthRes.status    === 'fulfilled' && healthRes.value.ok    ? await healthRes.value.json()                  : null;

  return { recipes, featured, categories, health };
}

export default async function HomePage() {
  const { recipes, featured, categories, health } = await getDataWrapper();

  const topCuisines: string[] = (categories.cuisines ?? []).slice(0, 10);
  const ctaCuisines: string[] = (categories.cuisines ?? []).slice(0, 3);

  const stats = [
    { icon: 'fa-book-open',  value: health ? `${health.usage.capacity.toLocaleString()}` : '1,050+', label: 'Recipes/Day' },
    { icon: 'fa-globe',      value: `${categories.cuisines?.length ?? 25}+`,                          label: 'Cuisines' },
    { icon: 'fa-bolt',       value: '<1s',                                                             label: 'Search Speed' },
    { icon: 'fa-shield-alt', value: '100%', label: 'Free to Use' },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero-bg relative overflow-hidden" style={{ minHeight: '88vh' }}>
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center justify-center text-center py-24 md:py-36">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium px-4 py-2 rounded-full mb-6 fade-in">
            <i className="fas fa-fire text-orange-500"></i> AI-Powered Recipe Discovery
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold leading-tight mb-6 fade-in" style={{ animationDelay: '0.1s' }}>
            Discover Amazing<br />
            <span className="text-orange-500">Recipes</span> Today
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 fade-in" style={{ animationDelay: '0.2s' }}>
            Enter the ingredients you have and instantly find thousands of delicious recipes. Zero waste, maximum flavour.
          </p>

          <div className="w-full max-w-2xl fade-in" style={{ animationDelay: '0.3s' }}>
            <SearchBar large />
          </div>

          {topCuisines.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2 fade-in" style={{ animationDelay: '0.4s' }}>
              {topCuisines.map(c => (
                <Link key={c} href={`/categories?type=cuisine&value=${encodeURIComponent(c)}`}
                  className="cat-pill text-xs text-gray-400 px-3 py-1.5">{c}</Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Stats (live from /api/health + /api/categories) ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-10 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="stat-card p-5 text-center">
              <i className={`fas ${s.icon} text-orange-500 text-xl mb-2 block`}></i>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Recipes (live from backend) ── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Featured Recipes</h2>
              <p className="text-gray-500 text-sm mt-2">Hand-picked favourites to get you started</p>
            </div>
            <Link href="/recipes" className="text-orange-500 text-sm hover:underline flex items-center gap-1">
              View all <i className="fas fa-arrow-right text-xs"></i>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featured.map((r: any, i: number) => (
              <Link key={r.id} href={`/recipes/${r.id}`}
                className="recipe-card block group fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="relative overflow-hidden" style={{ height: '140px' }}>
                  <img src={r.image} alt={r.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {r.readyInMinutes && (
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-gray-300 px-2 py-0.5 rounded-md">
                      ⏱ {r.readyInMinutes}m
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-xs text-white line-clamp-2">{r.title}</h3>
                  {r.cuisines?.[0] && <span className="text-[10px] text-orange-400 mt-1 block">{r.cuisines[0]}</span>}
                  {r.diets?.[0] && !r.cuisines?.[0] && <span className="text-[10px] text-green-400 mt-1 block capitalize">{r.diets[0]}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Random Recipes (top section) ── */}
      {recipes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Recipes to Inspire</h2>
              <p className="text-gray-500 text-sm mt-2">Handpicked random recipes to spark your cooking ideas</p>
            </div>
            <Link href="/recipes" className="text-orange-500 text-sm hover:underline flex items-center gap-1">
              Explore more <i className="fas fa-arrow-right text-xs"></i>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recipes.slice(0, 4).map((r: any) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
