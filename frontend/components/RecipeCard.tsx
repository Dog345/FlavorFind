import Image from 'next/image'
import Link from 'next/link'
import type { Recipe } from '@/src/lib/api'

function parseDuration(iso: string | null): string {
  if (!iso) return '—'
  const h = iso.match(/(\d+)H/)?.[1]
  const m = iso.match(/(\d+)M/)?.[1]
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  if (m) return `${m}m`
  return '—'
}

function starRating(rating: string | null): string {
  if (!rating) return ''
  const n = Math.round(parseFloat(rating))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

// Fallback placeholder images per category so cards always look great
const CATEGORY_FALLBACK: Record<string, string> = {
  Chicken:        'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=500&q=80',
  Dessert:        'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&q=80',
  Breakfast:      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500&q=80',
  Pasta:          'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&q=80',
  Seafood:        'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&q=80',
  Meat:           'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
  Pork:           'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
  Vegetable:      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80',
  Salads:         'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80',
  Soups:          'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80',
  Breads:         'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
  Pizza:          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80',
  Beverages:      'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=80',
  Fruit:          'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=500&q=80',
  Appetizers:     'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&q=80',
  default:        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=80',
}

function getImageUrl(recipe: Recipe): string {
  if (recipe.image_url) return recipe.image_url
  // try matching any word in category
  const cat = recipe.category ?? ''
  for (const key of Object.keys(CATEGORY_FALLBACK)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return CATEGORY_FALLBACK[key]
  }
  return CATEGORY_FALLBACK.default
}

export default function RecipeCard({ recipe, imageHeight = 170 }: { recipe: Recipe; imageHeight?: number }) {
  const imgSrc = getImageUrl(recipe)

  return (
    <div className="overflow-hidden rounded-md2 bg-dark-surface-2 border border-dark-border shadow-[0_14px_30px_-18px_rgba(0,0,0,0.5)] transition-transform duration-[250ms] hover:-translate-y-[6px] flex flex-col">

      {/* Food photo */}
      <div className="relative w-full flex-shrink-0 overflow-hidden" style={{ height: imageHeight }}>
        <Image
          src={imgSrc}
          alt={recipe.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
          unoptimized={imgSrc.includes('sndimg.com')}
        />
      </div>

      {/* Card body */}
      <div className="flex flex-col p-4">

        {/* Name */}
        <h3 className="mb-1.5 font-display text-[15px] leading-snug text-dark-text line-clamp-1">
          {recipe.name}
        </h3>

        {/* Description */}
        <p className="mb-3 text-[12px] leading-[1.5] text-dark-muted line-clamp-1">
          {recipe.description}
        </p>

        {/* Rating */}
        {recipe.rating && (
          <div className="mb-3 text-[12px] text-gold font-medium tracking-tight">
            {starRating(recipe.rating)}
            <span className="ml-1 text-[11px] text-dark-muted font-normal">
              ({recipe.review_count.toLocaleString()})
            </span>
          </div>
        )}

        {/* CTA — full width, always same size */}
        <Link
          href={`/recipes/${recipe.id}`}
          className="w-full text-center rounded-[20px] bg-terracotta px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-terracotta-dark transition-colors"
        >
          View Recipe →
        </Link>

      </div>
    </div>
  )
}
