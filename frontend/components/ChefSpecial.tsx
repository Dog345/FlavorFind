import Image from 'next/image'
import Link from 'next/link'
import { getFeaturedRecipes } from '@/src/lib/api'

export default async function ChefSpecial() {
  // Pick the top recipe that has an image
  let recipe = null
  try {
    const results = await getFeaturedRecipes(20)
    recipe = results.find(r => r.image_url) ?? results[0] ?? null
  } catch {
    // fall back to static content below
  }

  const imgSrc = recipe?.image_url ?? 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80'
  const name   = recipe?.name ?? 'Herb-Crusted Chicken'
  const desc   = recipe?.description
    ? recipe.description.slice(0, 120) + (recipe.description.length > 120 ? '…' : '')
    : 'A beautifully crafted recipe made with fresh ingredients — ready in under an hour.'

  return (
    <div className="mx-auto mb-[100px] max-w-[1240px] px-8">
      <div className="grid grid-cols-1 items-center gap-5 rounded-lg2 bg-gradient-to-br from-green-deep to-green-deeper p-[14px] text-white md:grid-cols-[auto_1fr_auto]">

        {/* Left — recipe photo */}
        <div className="relative h-[170px] w-full rounded-md2 overflow-hidden md:w-[220px] flex-shrink-0">
          <Image
            src={imgSrc}
            alt={name}
            fill
            className="object-cover"
            sizes="220px"
            unoptimized={imgSrc.includes('sndimg.com')}
          />
        </div>

        {/* Middle — script + title + dish name + description */}
        <div className="px-2">
          <span className="font-display italic text-[20px] text-gold-light">
            Recipe of the Week
          </span>
          <h3 className="mt-0.5 mb-2 font-display text-[28px] text-white leading-tight">
            This Week
          </h3>
          <div className="mb-1.5 text-[16px] font-semibold text-gold-light">
            {name}
          </div>
          <p className="text-[13px] leading-[1.6] text-[#cfd6cd] max-w-[420px]">
            {desc}
          </p>
        </div>

        {/* Right — limited badge + CTA */}
        <div className="flex-shrink-0 pr-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-gold-light text-[12px] font-semibold tracking-wide uppercase">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e3c477" strokeWidth="2">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
            </svg>
            This Week Only
          </div>
          <p className="text-[13px] leading-[1.6] text-[#cfd6cd] max-w-[180px]">
            A fan favourite recipe — highly rated and loved by thousands of home cooks.
          </p>
          <a
            href={recipe ? `/recipes/${recipe.id}` : '#dishes'}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-6 py-[10px] text-[13px] font-semibold text-white hover:bg-terracotta-dark transition-colors"
          >
            Try This Recipe →
          </a>
        </div>

      </div>
    </div>
  )
}
