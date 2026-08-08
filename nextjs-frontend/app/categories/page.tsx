import RecipeCard from '@/components/RecipeCard';
import Link from 'next/link';

const CUISINE_ICONS: Record<string, string> = {
  Italian:'fa-pizza-slice', Mexican:'fa-pepper-hot', Asian:'fa-utensils',
  African:'fa-globe-africa', American:'fa-flag', French:'fa-wine-glass',
  Mediterranean:'fa-sun', Indian:'fa-mortar-pestle', Japanese:'fa-fish',
  Chinese:'fa-yin-yang', Greek:'fa-columns', Spanish:'fa-guitar',
  Thai:'fa-leaf', Vietnamese:'fa-seedling', Korean:'fa-fire',
  Caribbean:'fa-umbrella-beach', German:'fa-beer', British:'fa-crown',
  Irish:'fa-clover', Eastern:'fa-moon',
};
const DIET_ICONS: Record<string, string> = {
  vegetarian:'fa-leaf', vegan:'fa-seedling', 'gluten free':'fa-wheat-awn',
  ketogenic:'fa-fire', paleo:'fa-bone', pescetarian:'fa-fish',
  primal:'fa-drumstick-bite', whole30:'fa-circle-check',
};
const TYPE_ICONS: Record<string, string> = {
  'main course':'fa-utensils', 'side dish':'fa-bowl-food', dessert:'fa-ice-cream',
  appetizer:'fa-cheese', salad:'fa-leaf', bread:'fa-bread-slice',
  breakfast:'fa-mug-hot', soup:'fa-bowl-hot', beverage:'fa-glass-water',
  sauce:'fa-droplet', snack:'fa-cookie', drink:'fa-martini-glass',
};

function getIcon(item: string, map: Record<string, string>) {
  const key = Object.keys(map).find(k => item.toLowerCase().includes(k.toLowerCase()));
  return map[key ?? ''] ?? 'fa-utensils';
}

interface Props { searchParams: Promise<{ type?: string; value?: string }>; }

async function getCategories() {
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { next: { revalidate: 86400 } });
    return r.ok ? r.json() : { cuisines: [], diets: [], meal_types: [] };
  } catch { return { cuisines: [], diets: [], meal_types: [] }; }
}

async function getCategoryRecipes(type: string, value: string) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const ep = type === 'cuisine' ? `/api/categories/cuisine/${encodeURIComponent(value)}`
    : type === 'diet' ? `/api/categories/diet/${encodeURIComponent(value)}`
    : `/api/categories/type/${encodeURIComponent(value)}`;
  const r = await fetch(`${base}${ep}&number=16`, { cache: 'no-store' });
  if (!r.ok) throw new Error((await r.json()).error || 'API error');
  return r.json();
}

function PillGrid({ title, items, filterType, activeType, activeValue, iconMap }: {
  title: string; items: string[]; filterType: string;
  activeType?: string; activeValue?: string; iconMap: Record<string, string>;
}) {
  return (
    <section className="mb-12">
      <h2 className="section-title mb-6">{title}</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {items.map(item => {
          const active = activeType === filterType && activeValue === item;
          return (
            <Link key={item} href={`/categories?type=${filterType}&value=${encodeURIComponent(item)}`}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                active
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-orange-500/50 hover:text-orange-400 hover:bg-[#222]'
              }`}>
              <i className={`fas ${getIcon(item, iconMap)} text-xl ${active ? 'text-white' : 'text-orange-500'}`}></i>
              <span className="text-xs font-medium leading-tight">{item}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default async function CategoriesPage({ searchParams }: Props) {
  const { type, value } = await searchParams;
  const categories = await getCategories();
  let recipes: any[] = [], total = 0, error = '';

  if (type && value) {
    try {
      const res = await getCategoryRecipes(type, value);
      recipes = res.results ?? [];
      total = res.totalResults ?? recipes.length;
    } catch (e: any) { error = e.message; }
  }

  const SECTIONS = [
    { title: '🌍 Cuisines',   items: categories.cuisines,   filterType: 'cuisine', iconMap: CUISINE_ICONS },
    { title: '🥗 Diets',      items: categories.diets,      filterType: 'diet',    iconMap: DIET_ICONS },
    { title: '🍽️ Meal Types', items: categories.meal_types, filterType: 'type',    iconMap: TYPE_ICONS },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <div className="mb-10">
        <h1 className="section-title">Explore Categories</h1>
        <p className="text-gray-500 text-sm mt-2">Browse recipes by cuisine, diet, or meal type</p>
      </div>

      {SECTIONS.map(section => (
        <div key={section.filterType}>
          <PillGrid
            title={section.title}
            items={section.items}
            filterType={section.filterType}
            activeType={type}
            activeValue={value}
            iconMap={section.iconMap}
          />

          {/* Results appear right after the section that was clicked */}
          {type === section.filterType && value && (
            <section className="mb-12">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="section-title capitalize">{value} Recipes</h2>
                  {total > 0 && <p className="text-gray-500 text-sm mt-1">{total} recipes found</p>}
                </div>
                <Link href="/categories" className="btn-ghost px-4 py-2 text-sm flex items-center gap-2">
                  <i className="fas fa-times text-xs"></i> Clear
                </Link>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-400 text-sm mb-6 flex items-center gap-3">
                  <i className="fas fa-exclamation-triangle"></i> {error}
                </div>
              )}

              {recipes.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {recipes.map((r: any, i: number) => (
                    <div key={r.id} className="fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <RecipeCard recipe={r} />
                    </div>
                  ))}
                </div>
              ) : !error && (
                <div className="text-center py-16 text-gray-500">
                  <i className="fas fa-search text-4xl mb-3 block"></i>
                  <p>No recipes found for <span className="text-orange-400">{value}</span></p>
                </div>
              )}
            </section>
          )}
        </div>
      ))}
    </div>
  );
}
