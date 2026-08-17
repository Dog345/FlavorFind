'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCategories } from '@/src/lib/api'
import Navbar from '@/components/Navbar'
import { StarBurst } from '@/components/Icons'
import Footer from '@/components/Footer'

// ── Food images per category (Unsplash, stable URLs) ──────────────────────────
const CAT_IMG: Record<string, string> = {
  'Dessert':        'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=75',
  'Lunch/Snacks':   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=75',
  'One Dish Meal':  'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=75',
  'Vegetable':      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=75',
  'Breakfast':      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=75',
  'Beverages':      'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=75',
  'Chicken':        'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=600&q=75',
  'Meat':           'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=75',
  'Breads':         'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=600&q=75',
  'Pork':           'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&q=75',
  'Sauces':         'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600&q=75',
  'Chicken Breast': 'https://images.unsplash.com/photo-1604503468506-a8da13d11bea?w=600&q=75',
  'Pasta':          'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=75',
  'Seafood':        'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&q=75',
  'Soups':          'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=75',
  'Salads':         'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=75',
  'Fruit':          'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=75',
  'Pizza':          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=75',
  'Fish':           'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=75',
  'Appetizers':     'https://images.unsplash.com/photo-1626200926749-ccb8e935e659?w=600&q=75',
  'Lamb':           'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=75',
  'Beef':           'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=75',
  'Casseroles':     'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=75',
  'Stew':           'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=75',
  'Side Dish':      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=75',
  'Cheese':         'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=75',
  'Eggs':           'https://images.unsplash.com/photo-1607690424506-f1d80f9a0834?w=600&q=75',
  'Beans':          'https://images.unsplash.com/photo-1574805627696-5d6f4b870cb6?w=600&q=75',
  'Veal':           'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=75',
  'Potatoes':       'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=75',
  default:          'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=75',
}

function getCatImg(name: string) {
  return CAT_IMG[name] ?? CAT_IMG.default
}

const GROUPS: { label: string; icon: string; cats: string[] }[] = [
  {
    label: 'By Meal Type', icon: '🍽',
    cats: ['Breakfast', 'Lunch/Snacks', 'One Dish Meal', 'Side Dish', 'Appetizers', 'Dessert', 'Beverages'],
  },
  {
    label: 'By Protein', icon: '🥩',
    cats: ['Chicken', 'Chicken Breast', 'Meat', 'Beef', 'Pork', 'Seafood', 'Fish', 'Lamb', 'Veal'],
  },
  {
    label: 'By Dish', icon: '🍳',
    cats: ['Pasta', 'Pizza', 'Soups', 'Stew', 'Casseroles', 'Salads', 'Breads', 'Sauces'],
  },
  {
    label: 'By Ingredient', icon: '🥦',
    cats: ['Vegetable', 'Fruit', 'Beans', 'Eggs', 'Cheese', 'Potatoes'],
  },
]

const OTHERS_PER_PAGE = 10

export default function CategoriesPage() {
  const [allCategories, setAllCategories] = useState<{ category: string; recipe_count: number }[]>([])
  const [othersPage, setOthersPage] = useState(1)

  useEffect(() => {
    getCategories().then(d => setAllCategories(d.categories)).catch(() => {})
  }, [])

  const countMap = Object.fromEntries(allCategories.map(c => [c.category, c.recipe_count]))
  const groupedNames = GROUPS.flatMap(g => g.cats)
  const others = allCategories.filter(c => !groupedNames.includes(c.category))
  const totalOthersPages = Math.ceil(others.length / OTHERS_PER_PAGE)
  const pagedOthers = others.slice((othersPage - 1) * OTHERS_PER_PAGE, othersPage * OTHERS_PER_PAGE)

  const totalRecipes = allCategories.reduce((s, c) => s + c.recipe_count, 0)

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* ── Hero ── */}
      <div className="bg-gradient-to-b from-green-deep to-green-deeper px-6 py-14 text-center">
        <div className="mx-auto max-w-[1240px]">
          <div className="eyebrow justify-center !text-gold-light mb-3">Browse</div>
          <h1 className="font-display text-[32px] text-white md:text-[46px]">
            Explore Recipe Categories
          </h1>
          <p className="mx-auto mt-3 max-w-[480px] text-[14px] leading-[1.7] text-white/60">
            From quick breakfasts to hearty dinners — find exactly what you&apos;re craving.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-[13px] text-white/50">
            <span>{allCategories.length} categories</span>
            <span>·</span>
            <span>{totalRecipes.toLocaleString()} recipes</span>
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
                <span className="text-[22px]">{group.icon}</span>
                <h2 className="font-display text-[22px] text-green-deep">{group.label}</h2>
                <div className="flex-1 h-px bg-cream-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {cats.map(({ name, count }) => (
                  <Link
                    key={name}
                    href={`/recipes?category=${encodeURIComponent(name)}`}
                    className="group relative overflow-hidden rounded-lg2 shadow-[0_4px_16px_-6px_rgba(18,51,38,0.2)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_-10px_rgba(18,51,38,0.3)] bg-white"
                  >
                    {/* Food image */}
                    <div className="relative h-[140px] overflow-hidden">
                      <Image
                        src={getCatImg(name)}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      {/* Category name overlaid on image */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-display text-[14px] text-white leading-tight drop-shadow">{name}</h3>
                      </div>
                    </div>
                    {/* Count + hover cta */}
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <span className="text-[12px] text-ink-soft">{count.toLocaleString()} recipes</span>
                      <span className="text-[11.5px] font-semibold text-terracotta opacity-0 transition-opacity group-hover:opacity-100">
                        Browse →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}

        {/* ── All other categories (paginated) ── */}
        {others.length > 0 && (
          <div className="mb-14">
            <div className="mb-6 flex items-center gap-3">
              <span className="text-[22px]">🗂</span>
              <h2 className="font-display text-[22px] text-green-deep">All Other Categories</h2>
              <div className="flex-1 h-px bg-cream-2" />
              <span className="text-[12px] text-ink-soft">{others.length} total</span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {pagedOthers.map(({ category, recipe_count }) => (
                <Link
                  key={category}
                  href={`/recipes?category=${encodeURIComponent(category)}`}
                  className="group relative overflow-hidden rounded-lg2 bg-white shadow-[0_4px_16px_-6px_rgba(18,51,38,0.12)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_-10px_rgba(18,51,38,0.25)]"
                >
                  <div className="relative h-[100px] overflow-hidden">
                    <Image
                      src={getCatImg(category)}
                      alt={category}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width:640px) 50vw, 20vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <span className="font-display text-[12px] text-white leading-tight line-clamp-1 drop-shadow">{category}</span>
                    </div>
                  </div>
                  <div className="px-2.5 py-2">
                    <span className="text-[11px] text-ink-soft">{recipe_count.toLocaleString()} recipes</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalOthersPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setOthersPage(p => Math.max(1, p - 1))}
                  disabled={othersPage === 1}
                  className="rounded-full border border-green-deep/20 px-5 py-2 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span className="px-4 text-[13px] text-ink-soft">
                  Page {othersPage} of {totalOthersPages}
                </span>
                <button
                  onClick={() => setOthersPage(p => Math.min(totalOthersPages, p + 1))}
                  disabled={othersPage === totalOthersPages}
                  className="rounded-full border border-green-deep/20 px-5 py-2 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

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
