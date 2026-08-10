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

async function getDataWrapper() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  
  const [sectionsRes, categoriesRes, healthRes] = await Promise.allSettled([
    fetch(`${base}/api/sections`,     { next: { revalidate: 3600 } }),
    fetch(`${base}/api/categories`,   { next: { revalidate: 86400 } }),
    fetch(`${base}/api/health`,       { next: { revalidate: 300 } }),
  ]);

  const sections   = sectionsRes.status === 'fulfilled' && sectionsRes.value.ok ? (await sectionsRes.value.json()).data ?? [] : [];
  const categories = categoriesRes.status === 'fulfilled' && categoriesRes.value.ok ? await categoriesRes.value.json() : { cuisines: [], diets: [], meal_types: [] };
  const health     = healthRes.status === 'fulfilled' && healthRes.value.ok ? await healthRes.value.json() : null;

  return { sections, categories, health };
}

export default async function HomePage() {
  const { sections, categories, health } = await getDataWrapper();

  const topCuisines: string[] = (categories.cuisines ?? []).slice(0, 10);

  const stats = [
    { icon: 'fa-book-open',  value: '1,000+', label: 'Recipes' },
    { icon: 'fa-globe',      value: `${categories.cuisines?.length ?? 25}+`, label: 'Cuisines' },
    { icon: 'fa-carrot',     value: '200+', label: 'Ingredients' },
    { icon: 'fa-bolt',       value: '<1s', label: 'Search Speed' },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero-bg relative overflow-hidden" style={{ minHeight: '88vh' }}>
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center justify-center text-center py-24 md:py-36">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium px-4 py-2 rounded-full mb-6 fade-in">
            <i className="fas fa-fire text-orange-500"></i> 1,000+ Curated Recipes
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold leading-tight mb-6 fade-in" style={{ animationDelay: '0.1s' }}>
            Discover Amazing<br />
            <span className="text-orange-500">Recipes</span> Today
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 fade-in" style={{ animationDelay: '0.2s' }}>
            Enter the ingredients you have and instantly find delicious recipes. Zero waste, maximum flavour.
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

      {/* ── Stats ── */}
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

      {/* ── Database-Driven Sections ── */}
      {sections.map((section: any, sectionIndex: number) => {
        if (!section.recipes || section.recipes.length === 0) return null;
        
        return (
          <section key={section.id} className="max-w-7xl mx-auto px-4 md:px-8 mb-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="section-title">{section.title}</h2>
                <p className="text-gray-500 text-sm mt-2">
                  {section.slug === 'trending-now' && 'Most popular recipes right now'}
                  {section.slug === 'quick-bites' && 'Ready in 30 minutes or less'}
                  {section.slug === 'world-cuisines' && 'Explore flavors from around the globe'}
                  {section.slug === 'healthy-heroes' && 'Nutritious and delicious meals'}
                  {section.slug === 'dessert-paradise' && 'Sweet treats for every occasion'}
                  {section.slug === 'comfort-food' && 'Soul-warming classics'}
                  {section.slug === 'breakfast-club' && 'Start your day right'}
                  {section.slug === 'vegan-vibes' && 'Plant-based perfection'}
                  {section.slug === 'italian-classics' && 'Authentic Italian favorites'}
                  {!['trending-now', 'quick-bites', 'world-cuisines', 'healthy-heroes', 'dessert-paradise', 'comfort-food', 'breakfast-club', 'vegan-vibes', 'italian-classics'].includes(section.slug) && 'Delicious recipes curated for you'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {section.recipes.slice(0, 5).map((recipe: any, i: number) => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`}
                  className="recipe-card block group fade-in" style={{ animationDelay: `${(sectionIndex * 0.1) + (i * 0.05)}s` }}>
                  <div className="relative overflow-hidden rounded-lg" style={{ height: '180px' }}>
                    <img src={recipe.image} alt={recipe.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {recipe.readyInMinutes && (
                      <span className="absolute top-2 right-2 text-xs bg-black/70 text-white px-2 py-1 rounded-md backdrop-blur-sm">
                        ⏱ {recipe.readyInMinutes}m
                      </span>
                    )}
                    
                    {recipe.rating && (
                      <span className="absolute top-2 left-2 text-xs bg-orange-500/90 text-white px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1">
                        <i className="fas fa-star text-xs"></i> {recipe.rating.toFixed(1)}
                      </span>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-semibold text-sm text-white line-clamp-2 mb-1">{recipe.title}</h3>
                      <div className="flex items-center gap-2 text-xs">
                        {recipe.cuisines?.[0] && (
                          <span className="text-orange-400">🌍 {recipe.cuisines[0]}</span>
                        )}
                        {recipe.servings && (
                          <span className="text-gray-300">• {recipe.servings} servings</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* ── Browse by Category CTA ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mb-20">
        <div className="cta-card p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Browse by cuisine, diet, or meal type to discover thousands more recipes
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/categories?type=cuisine" className="btn-primary">
              <i className="fas fa-globe mr-2"></i>Browse Cuisines
            </Link>
            <Link href="/categories?type=diet" className="btn-secondary">
              <i className="fas fa-leaf mr-2"></i>Browse Diets
            </Link>
            <Link href="/categories?type=meal_type" className="btn-secondary">
              <i className="fas fa-utensils mr-2"></i>Browse Meal Types
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
