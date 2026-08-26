import Image from 'next/image'
import Link from 'next/link'
import { getCategories, searchRecipes } from '@/src/lib/api'
import Navbar from '@/components/Navbar'
import { StarBurst } from '@/components/Icons'
import Footer from '@/components/Footer'

// Fetch one recipe image for a category
async function getCategoryImage(category: string): Promise<string | null> {
  try {
    const res = await searchRecipes(
      [
        '8bd94446-b88a-492f-95bc-74a44c2204b4', // salt — broadest coverage
        '13ba49f1-6fd7-45b4-989d-f02456efdad5', // sugar
      ],
      { limit: 5, category }
    )
    const withImage = res.results.find(r => r.image_url)
    return withImage?.image_url ?? res.results[0]?.image_url ?? null
  } catch {
    return null
  }
}

// Fallback per category if no image found
const FALLBACKS: Record<string, string> = {
  'Curries':     'https://images.unsplash.com/photo-1574484284002-952d92456975?w=500&q=80',
  'Stew':        'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80',
  'Beverages':   'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=80',
  'Breads':      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
  'Dessert':     'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&q=80',
  'Breakfast':   'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500&q=80',
  'Vegetable':   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80',
  'default':     'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=80',
}

function getFallback(category: string): string {
  return FALLBACKS[category] ?? FALLBACKS.default
}

export default async function CategoriesPage() {
  let allCategories: { category: string; recipe_count: number }[] = []
  try {
    const data = await getCategories()
    allCategories = data.categories
  } catch { /* silently fail */ }

  const total = allCategories.reduce((s, c) => s + c.recipe_count, 0)

  // Fetch images for all categories in parallel
  const images = await Promise.all(
    allCategories.map(c => getCategoryImage(c.category))
  )

  return (
    <div className="min-h-screen bg-cream">

      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-b from-green-deep to-green-deeper px-6 py-14 text-center">
        <div className="mx-auto max-w-[1240px]">
          <div className="eyebrow justify-center !text-gold-light mb-3">Browse</div>
          <h1 className="font-display text-[32px] text-white md:text-[46px]">
            Explore Recipe Categories
          </h1>
          <p className="mx-auto mt-3 max-w-[480px] text-[14px] leading-[1.7] text-white/60">
            From quick breakfasts to hearty dinners — find exactly what you&apos;re craving.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-[13px] text-white/50">
            <span>🍽 {allCategories.length} categories</span>
            <span>·</span>
            <span>📖 {total.toLocaleString()} recipes</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-6 py-12 md:px-8">

        {/* Categories grid */}
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {allCategories.map(({ category, recipe_count }, i) => {
            const imgSrc = images[i] ?? getFallback(category)
            const unoptimized = imgSrc.includes('sndimg.com')

            return (
              <Link
                key={category}
                href={`/recipes?category=${encodeURIComponent(category)}`}
                className="group relative overflow-hidden rounded-xl shadow-[0_6px_20px_-8px_rgba(18,51,38,0.25)] transition-all hover:-translate-y-1 hover:shadow-[0_14px_32px_-10px_rgba(18,51,38,0.35)]"
                style={{ aspectRatio: '4/3' }}
              >
                {/* Recipe image */}
                <Image
                  src={imgSrc}
                  alt={category}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized={unoptimized}
                />

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                {/* Text */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-display text-[16px] font-semibold leading-tight text-white">
                    {category}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-white/70">
                    {recipe_count.toLocaleString()} {recipe_count === 1 ? 'recipe' : 'recipes'}
                  </p>
                </div>

                {/* Hover arrow */}
                <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/0 text-white opacity-0 transition-all group-hover:bg-white/20 group-hover:opacity-100">
                  →
                </div>
              </Link>
            )
          })}
        </div>

        {/* CTA strip */}
        <div className="mt-14 rounded-2xl bg-gradient-to-br from-green-deep to-green-deeper px-8 py-10 text-center text-white">
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
