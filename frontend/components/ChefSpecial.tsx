import Image from 'next/image'
import { getFeaturedRecipes, parseIsoMinutes } from '@/src/lib/api'

function parseDuration(iso: string | null): string {
  if (!iso) return '—'
  const mins = parseIsoMinutes(iso)
  if (!mins) return '—'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default async function ChefSpecial() {
  let recipe = null
  try {
    const results = await getFeaturedRecipes(20)
    // Prefer visually appealing main-dish categories — skip beans, beverages, salads
    const SKIP = ['beans', 'beverages', 'salad', 'salad dressings', 'chutneys', 'sauces', 'dessert']
    recipe =
      results.find(r => r.image_url && !SKIP.includes(r.category?.toLowerCase() ?? '')) ??
      results.find(r => r.image_url) ??
      results[0] ??
      null
  } catch {
    // fall back to static content below
  }

  const imgSrc    = recipe?.image_url ?? 'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=80'
  const name      = recipe?.name ?? 'Herb-Crusted Chicken'
  const desc      = recipe?.description
    ? recipe.description.slice(0, 200) + (recipe.description.length > 200 ? '…' : '')
    : 'A beautifully crafted recipe made with fresh ingredients — ready in under an hour and loved by thousands of home cooks around the world.'
  const category  = recipe?.category ?? 'Main Course'
  const totalTime = parseDuration(recipe?.total_time ?? null)
  const servings  = recipe?.servings ?? null
  const rating    = recipe?.rating ? parseFloat(recipe.rating).toFixed(1) : null
  const reviews   = recipe?.review_count ?? 0

  return (
    <section
      className="relative py-[60px] lg:py-[80px] overflow-hidden"
      style={{
        backgroundImage: `url(${imgSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(8,22,16,0.55) 0%, rgba(8,22,16,0.40) 50%, rgba(8,22,16,0.60) 100%)' }}
      />

      {/* Content wrapper */}
      <div className="relative mx-auto max-w-[1240px] px-8">

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl min-h-[480px] flex flex-col md:flex-row">

          {/* Left: recipe photo */}
          <div className="relative w-full md:w-[55%] min-h-[300px] md:min-h-[480px] flex-shrink-0">
            <Image
              src={imgSrc}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 55vw"
              unoptimized={imgSrc.includes('sndimg.com')}
              priority
            />
            {/* Gradient bleed into right panel */}
            <div className="absolute inset-0 md:bg-gradient-to-r md:from-transparent md:to-[#0d2820]" />
            {/* Category badge */}
            <div className="absolute top-5 left-5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 text-[12px] font-semibold text-white uppercase tracking-wider">
              {category}
            </div>
          </div>

          {/* Right: content */}
          <div className="relative flex flex-col justify-center bg-[#0d2820]/80 md:bg-transparent px-8 py-10 md:px-10 md:w-[45%]">

            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-[1px] w-8 bg-gold-light/60" />
              <span className="text-[12px] font-semibold uppercase tracking-[2px] text-gold-light">
                Recipe of the Week
              </span>
            </div>

            {/* Title */}
            <h2 className="font-display text-[36px] md:text-[42px] leading-[1.1] text-white mb-4 max-w-[380px]">
              {name}
            </h2>

            {/* Description */}
            <p className="text-[14px] leading-[1.75] text-white/65 mb-7 max-w-[360px]">
              {desc}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-8">
              {totalTime !== '—' && (
                <div className="flex flex-col items-center gap-0.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e3c477" strokeWidth="1.8" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                  </svg>
                  <span className="text-[13px] font-semibold text-white">{totalTime}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wide">Time</span>
                </div>
              )}
              {servings && (
                <div className="flex flex-col items-center gap-0.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e3c477" strokeWidth="1.8" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span className="text-[13px] font-semibold text-white">{servings}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wide">Serves</span>
                </div>
              )}
              {rating && (
                <div className="flex flex-col items-center gap-0.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e3c477" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-[13px] font-semibold text-white">{rating}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wide">{reviews.toLocaleString()} reviews</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <a
                href={recipe ? `/recipes/${recipe.id}` : '#dishes'}
                className="inline-flex items-center gap-2 rounded-full bg-terracotta px-7 py-3.5 text-[14px] font-semibold text-white hover:bg-terracotta-dark transition-colors shadow-[0_8px_24px_-8px_rgba(210,98,44,0.6)]"
              >
                Try This Recipe →
              </a>
              <a
                href="/recipes"
                className="text-[13px] font-medium text-white/50 hover:text-white transition-colors underline underline-offset-4"
              >
                Browse all
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
