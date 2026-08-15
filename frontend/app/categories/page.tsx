import Link from 'next/link'
import { getCategories } from '@/src/lib/api'
import Navbar from '@/components/Navbar'
import { StarBurst } from '@/components/Icons'
import Footer from '@/components/Footer'

// Emoji + color per category
const CAT_META: Record<string, { emoji: string; color: string }> = {
  'Dessert':          { emoji: '🍰', color: 'from-pink-400/20 to-pink-100/10' },
  'Lunch/Snacks':     { emoji: '🥙', color: 'from-yellow-400/20 to-yellow-100/10' },
  'One Dish Meal':    { emoji: '🥘', color: 'from-orange-400/20 to-orange-100/10' },
  'Vegetable':        { emoji: '🥦', color: 'from-green-400/20 to-green-100/10' },
  'Breakfast':        { emoji: '🥞', color: 'from-amber-400/20 to-amber-100/10' },
  'Beverages':        { emoji: '🥤', color: 'from-blue-400/20 to-blue-100/10' },
  'Chicken':          { emoji: '🍗', color: 'from-yellow-500/20 to-yellow-100/10' },
  'Meat':             { emoji: '🥩', color: 'from-red-400/20 to-red-100/10' },
  'Breads':           { emoji: '🍞', color: 'from-amber-600/20 to-amber-100/10' },
  'Pork':             { emoji: '🥓', color: 'from-pink-500/20 to-pink-100/10' },
  'Sauces':           { emoji: '🫙', color: 'from-red-300/20 to-red-100/10' },
  'Chicken Breast':   { emoji: '🍖', color: 'from-yellow-400/20 to-yellow-100/10' },
  'Pasta':            { emoji: '🍝', color: 'from-yellow-300/20 to-yellow-100/10' },
  'Seafood':          { emoji: '🦞', color: 'from-blue-500/20 to-blue-100/10' },
  'Soups':            { emoji: '🍲', color: 'from-orange-300/20 to-orange-100/10' },
  'Salads':           { emoji: '🥗', color: 'from-green-500/20 to-green-100/10' },
  'Fruit':            { emoji: '🍎', color: 'from-red-400/20 to-red-100/10' },
  'Pizza':            { emoji: '🍕', color: 'from-orange-500/20 to-orange-100/10' },
  'Fish':             { emoji: '🐟', color: 'from-cyan-400/20 to-cyan-100/10' },
  'Appetizers':       { emoji: '🫙', color: 'from-purple-400/20 to-purple-100/10' },
  'Lamb':             { emoji: '🍖', color: 'from-red-500/20 to-red-100/10' },
  'Beef':             { emoji: '🥩', color: 'from-red-600/20 to-red-100/10' },
  'Casseroles':       { emoji: '🥗', color: 'from-amber-400/20 to-amber-100/10' },
  'Stew':             { emoji: '🫕', color: 'from-brown-400/20 to-orange-100/10' },
  'Side Dish':        { emoji: '🍜', color: 'from-teal-400/20 to-teal-100/10' },
  'Cheese':           { emoji: '🧀', color: 'from-yellow-400/20 to-yellow-100/10' },
  'Eggs':             { emoji: '🥚', color: 'from-yellow-200/20 to-yellow-100/10' },
  'Beans':            { emoji: '🫘', color: 'from-green-600/20 to-green-100/10' },
  'Veal':             { emoji: '🍖', color: 'from-pink-300/20 to-pink-100/10' },
  'Potatoes':         { emoji: '🥔', color: 'from-amber-300/20 to-amber-100/10' },
  default:            { emoji: '🍽', color: 'from-gray-400/20 to-gray-100/10' },
}

function getMeta(category: string) {
  return CAT_META[category] ?? CAT_META.default
}

// Group categories into cuisine, meal type, ingredient-based
const GROUPS: { label: string; emoji: string; cats: string[] }[] = [
  {
    label: 'By Meal Type',
    emoji: '🍽',
    cats: ['Breakfast', 'Lunch/Snacks', 'One Dish Meal', 'Side Dish', 'Appetizers', 'Dessert', 'Beverages'],
  },
  {
    label: 'By Protein',
    emoji: '🥩',
    cats: ['Chicken', 'Chicken Breast', 'Meat', 'Beef', 'Pork', 'Seafood', 'Fish', 'Lamb', 'Veal'],
  },
  {
    label: 'By Dish',
    emoji: '🍳',
    cats: ['Pasta', 'Pizza', 'Soups', 'Stew', 'Casseroles', 'Salads', 'Breads', 'Sauces'],
  },
  {
    label: 'By Ingredient',
    emoji: '🥦',
    cats: ['Vegetable', 'Fruit', 'Beans', 'Eggs', 'Cheese', 'Potatoes'],
  },
]

export default async function CategoriesPage() {
  let allCategories: { category: string; recipe_count: number }[] = []
  try {
    const data = await getCategories()
    allCategories = data.categories
  } catch { /* silently fail */ }

  const countMap = Object.fromEntries(allCategories.map(c => [c.category, c.recipe_count]))

  return (
    <div className="min-h-screen bg-cream">

      <Navbar />

      {/* ── Page Hero ── */}
      <div className="bg-gradient-to-b from-green-deep to-green-deeper px-6 py-14 text-center">
        <div className="mx-auto max-w-[1240px]">
          <div className="eyebrow justify-center !text-gold-light mb-3">
            Browse
          </div>
          <h1 className="font-display text-[32px] text-white md:text-[46px]">
            Explore Recipe Categories
          </h1>
          <p className="mx-auto mt-3 max-w-[480px] text-[14px] leading-[1.7] text-white/60">
            From quick breakfasts to hearty dinners — find exactly what you&apos;re craving.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-[13px] text-white/50">
            <span>🍽 {allCategories.length} categories</span>
            <span>·</span>
            <span>📖 {allCategories.reduce((s, c) => s + c.recipe_count, 0).toLocaleString()} recipes</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-6 py-12 md:px-8">

        {/* ── Grouped sections ── */}
        {GROUPS.map(group => {
          const cats = group.cats
            .map(name => ({ name, count: countMap[name] ?? 0 }))
            .filter(c => c.count > 0)
          if (cats.length === 0) return null
          return (
            <div key={group.label} className="mb-14">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-[24px]">{group.emoji}</span>
                <h2 className="font-display text-[22px] text-green-deep">{group.label}</h2>
                <div className="flex-1 h-px bg-cream-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {cats.map(({ name, count }) => {
                  const meta = getMeta(name)
                  return (
                    <Link
                      key={name}
                      href={`/recipes?category=${encodeURIComponent(name)}`}
                      className={`group relative overflow-hidden rounded-lg2 bg-gradient-to-br ${meta.color} border border-white bg-white p-5 shadow-[0_4px_16px_-6px_rgba(18,51,38,0.15)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_-10px_rgba(18,51,38,0.25)]`}
                    >
                      <div className="mb-3 text-[36px]">{meta.emoji}</div>
                      <h3 className="font-display text-[15px] leading-tight text-green-deep">{name}</h3>
                      <p className="mt-1 text-[12px] text-ink-soft">{count.toLocaleString()} recipes</p>
                      <div className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-terracotta opacity-0 transition-opacity group-hover:opacity-100">
                        Browse →
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* ── All other categories ── */}
        {(() => {
          const grouped = GROUPS.flatMap(g => g.cats)
          const others = allCategories.filter(c => !grouped.includes(c.category))
          if (others.length === 0) return null
          return (
            <div className="mb-14">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-[24px]">🗂</span>
                <h2 className="font-display text-[22px] text-green-deep">All Other Categories</h2>
                <div className="flex-1 h-px bg-cream-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {others.map(({ category, recipe_count }) => {
                  const meta = getMeta(category)
                  return (
                    <Link
                      key={category}
                      href={`/recipes?category=${encodeURIComponent(category)}`}
                      className="group flex flex-col items-center rounded-md2 bg-white py-5 px-3 text-center shadow-[0_4px_16px_-6px_rgba(18,51,38,0.12)] border border-cream-2 transition-all hover:-translate-y-1 hover:border-green-deep/20"
                    >
                      <span className="mb-2 text-[28px]">{meta.emoji}</span>
                      <span className="font-display text-[13px] text-green-deep leading-tight line-clamp-1">{category}</span>
                      <span className="mt-1 text-[11px] text-ink-soft">{recipe_count.toLocaleString()}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── CTA strip ── */}
        <div className="rounded-lg2 bg-gradient-to-br from-green-deep to-green-deeper px-8 py-10 text-center text-white">
          <div className="eyebrow justify-center !text-gold-light mb-3">
            <StarBurst className="h-4 w-4 fill-gold-light" />
            Can&apos;t find what you&apos;re looking for?
          </div>
          <h2 className="font-display text-[24px] text-white">Search by Ingredient Instead</h2>
          <p className="mx-auto mt-2 mb-6 max-w-[420px] text-[14px] text-white/60">
            Tell us what&apos;s in your fridge and we&apos;ll find matching recipes instantly.
          </p>
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-7 py-3.5 text-[14px] font-semibold text-white hover:bg-terracotta-dark transition-colors"
          >
            Search Recipes →
          </Link>
        </div>

      </div>

      <Footer />
    </div>
  )
}
