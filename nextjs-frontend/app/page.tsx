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

async function getData() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const [sectionsRes, categoriesRes, healthRes] = await Promise.allSettled([
    fetch(`${base}/api/sections`,                                        { next: { revalidate: 3600 } }),
    fetch(`${base}/api/categories`,                                        { next: { revalidate: 86400 } }),
    fetch(`${base}/api/health`,                                            { next: { revalidate: 300 } }),
  ]);

  const sections   = sectionsRes.status === 'fulfilled' && sectionsRes.value.ok ? (await sectionsRes.value.json()).data ?? [] : [];
  const categories = categoriesRes.status === 'fulfilled' && categoriesRes.value.ok ? await categoriesRes.value.json()             : { cuisines: [], diets: [], meal_types: [] };
  const health     = healthRes.status    === 'fulfilled' && healthRes.value.ok    ? await healthRes.value.json()                  : null;

  // Get featured from first section
  const featured = sections.length > 0 && sections[0].recipes ? sections[0].recipes.slice(0, 6) : [];
  // Get recipes from second section or all from first
  const recipes = sections.length > 1 && sections[1].recipes ? sections[1].recipes.slice(0, 8) : (sections.length > 0 && sections[0].recipes ? sections[0].recipes.slice(6, 14) : []);

  return { recipes, featured, categories, health, sections };
}

export default async function HomePage() {
  const { recipes, featured, categories, health } = await getData();

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

      {/* ── Live random recipes ── */}
      {recipes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">✨ Discover Today</h2>
              <p className="text-gray-500 text-sm mt-2">Fresh picks from our recipe database</p>
            </div>
            <Link href="/recipes" className="text-orange-500 text-sm hover:underline flex items-center gap-1">
              View all <i className="fas fa-arrow-right text-xs"></i>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {recipes.map((r: any, i: number) => (
              <div key={r.id} className="fade-in" style={{ animationDelay: `${i * 0.06}s` }}>
                <RecipeCard recipe={r} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mb-20">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-8 md:p-14">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title mb-6">Smart Recipe Finder</h2>
              <p className="text-gray-400 mb-8">Enter what's in your fridge and we'll match you with hundreds of recipes — reducing food waste and saving you time.</p>
              <div className="space-y-5">
                {[
                  { icon: 'fa-search',   title: 'Enter Ingredients', desc: 'Type what you have — chicken, rice, garlic, anything.' },
                  { icon: 'fa-magic',    title: 'AI Matches Recipes', desc: 'Our engine finds the best matches instantly.' },
                  { icon: 'fa-utensils', title: 'Cook & Enjoy',       desc: 'Follow step-by-step instructions and enjoy your meal.' },
                ].map(s => (
                  <div key={s.title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <i className={`fas ${s.icon} text-orange-500 text-sm`}></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{s.title}</h4>
                      <p className="text-gray-500 text-xs mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/recipes" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm mt-8">
                Start Cooking <i className="fas fa-arrow-right text-xs"></i>
              </Link>
            </div>
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80"
                alt="Cooking" className="rounded-2xl w-full object-cover shadow-2xl" style={{ height: '380px' }} />
              <div className="absolute -bottom-4 -left-4 bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-check text-green-400"></i>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Recipe Found!</p>
                    <p className="text-[10px] text-gray-500">Matched 8 ingredients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Browse cuisines CTA (live from /api/categories) ── */}
      {ctaCuisines.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Browse by Cuisine</h2>
              <p className="text-gray-500 text-sm mt-2">{categories.cuisines?.length ?? 0} cuisines available</p>
            </div>
            <Link href="/categories" className="text-orange-500 text-sm hover:underline flex items-center gap-1">
              All categories <i className="fas fa-arrow-right text-xs"></i>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {ctaCuisines.map((c: string) => (
              <Link key={c} href={`/categories?type=cuisine&value=${encodeURIComponent(c)}`}
                className="relative overflow-hidden rounded-2xl group block" style={{ height: '200px' }}>
                <img src={CUISINE_IMAGES[c] ?? DEFAULT_IMG} alt={c}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-bold text-white text-lg">{c}</h3>
                  <p className="text-gray-400 text-xs">{c} cuisine recipes</p>
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <i className="fas fa-arrow-right text-white text-xs"></i>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
