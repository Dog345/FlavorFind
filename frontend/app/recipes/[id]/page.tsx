import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRecipe, getFeaturedRecipes, type Recipe } from '@/src/lib/api'
import Navbar from '@/components/Navbar'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const CATEGORY_FALLBACK: Record<string, string> = {
  Chicken:   'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=1200&q=80',
  Dessert:   'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=1200&q=80',
  Pasta:     'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=1200&q=80',
  Seafood:   'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=1200&q=80',
  Meat:      'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80',
  Vegetable: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80',
  Soups:     'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=80',
  Breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=1200&q=80',
  default:   'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&q=80',
}

function getImg(imageUrl: string | null | undefined, category: string): string {
  if (imageUrl) return imageUrl
  for (const key of Object.keys(CATEGORY_FALLBACK)) {
    if (category.toLowerCase().includes(key.toLowerCase())) return CATEGORY_FALLBACK[key]
  }
  return CATEGORY_FALLBACK.default
}

function getDifficultyFromTime(totalTime: string | null): { label: string; color: string } {
  if (!totalTime) return { label: 'Unknown', color: 'bg-ink-soft' }
  const mins = (parseInt(totalTime.match(/(\d+)H/)?.[1] ?? '0') * 60) +
               parseInt(totalTime.match(/(\d+)M/)?.[1] ?? '0')
  if (mins <= 30)  return { label: 'Easy',   color: 'bg-[#4caf50]' }
  if (mins <= 60)  return { label: 'Medium', color: 'bg-gold' }
  return              { label: 'Advanced', color: 'bg-terracotta' }
}

function getNutrientPercent(value: string | null, max: number): number {
  if (!value) return 0
  return Math.min(100, Math.round((parseFloat(value) / max) * 100))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RecipePage({ params }: { params: { id: string } }) {
  let recipe
  try {
    recipe = await getRecipe(params.id)
  } catch {
    redirect('/')
  }

  // Fetch related recipes in parallel
  let related: Recipe[] = []
  try {
    const all = await getFeaturedRecipes(8)
    related = all.filter(r => r.id !== recipe.id).slice(0, 3)
  } catch { /* ignore */ }

  const imgSrc    = getImg(recipe.image_url, recipe.category)
  const difficulty = getDifficultyFromTime(recipe.total_time)
  const calories   = recipe.calories ? Math.round(parseFloat(recipe.calories)) : null

  return (
    <div className="min-h-screen bg-cream">

      {/* ══════════════════════════════════════════
          1. NAVBAR
      ══════════════════════════════════════════ */}
      <Navbar />

      {/* ══════════════════════════════════════════
          2. HERO — full-bleed image with title overlay
      ══════════════════════════════════════════ */}
      <div className="relative h-[55vw] max-h-[560px] min-h-[280px] w-full">
        <Image
          src={imgSrc}
          alt={recipe.name}
          fill
          className="object-cover"
          priority
          unoptimized={imgSrc.includes('sndimg.com')}
          sizes="100vw"
        />
        {/* Multi-stop gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Hero text — bottom left */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 md:px-10 md:pb-10">
          <div className="mx-auto max-w-[1240px]">
            {/* Breadcrumb */}
            <div className="mb-2 flex items-center gap-2 text-[12px] text-white/70">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white/50">{recipe.category}</span>
            </div>
            {/* Difficulty badge */}
            <span className={`mb-3 inline-block rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white ${difficulty.color}`}>
              {difficulty.label}
            </span>
            <h1 className="font-display text-[26px] font-semibold leading-tight text-white md:text-[42px] lg:text-[52px] max-w-[800px]">
              {recipe.name}
            </h1>
            {recipe.rating && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-[15px] text-gold">{starRating(recipe.rating)}</span>
                <span className="text-[13px] text-white/80">
                  {parseFloat(recipe.rating).toFixed(1)} · {recipe.review_count.toLocaleString()} reviews
                </span>
                <span className="hidden h-4 w-px bg-white/30 sm:block" />
                <span className="text-[13px] text-white/80">{recipe.category}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          3. QUICK STATS BAR
      ══════════════════════════════════════════ */}
      <div className="bg-green-deep px-6 py-4">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-0 divide-x divide-white/20 md:justify-start">
          {[
            { icon: '⏱', label: 'Prep',   value: parseDuration(recipe.prep_time) },
            { icon: '🍳', label: 'Cook',   value: parseDuration(recipe.cook_time) },
            { icon: '⏰', label: 'Total',  value: parseDuration(recipe.total_time) },
            { icon: '🍽', label: 'Serves', value: recipe.servings ? String(recipe.servings) : '—' },
            { icon: '🔥', label: 'Kcal',   value: calories ? String(calories) : '—' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex flex-col items-center px-5 py-1">
              <span className="text-[18px]">{icon}</span>
              <span className="text-[15px] font-semibold text-white">{value}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MAIN CONTENT WRAPPER
      ══════════════════════════════════════════ */}
      <div className="mx-auto max-w-[1240px] px-6 py-10 md:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-10">

            {/* ══════════════════════════════════════════
                4. DESCRIPTION
            ══════════════════════════════════════════ */}
            <div className="rounded-lg2 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(18,51,38,0.15)]">
              <h2 className="mb-3 font-display text-[20px] text-green-deep">About This Recipe</h2>
              <p className="text-[15px] leading-[1.8] text-ink-soft">{recipe.description}</p>

              {/* Keyword tags */}
              {recipe.keywords?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {recipe.keywords.map(kw => (
                    <span key={kw} className="rounded-full bg-cream-2 px-3 py-1 text-[11.5px] font-medium text-green-deep">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════
                5. INSTRUCTIONS
            ══════════════════════════════════════════ */}
            {recipe.instructions?.length > 0 && (
              <div>
                <h2 className="mb-6 font-display text-[24px] text-green-deep">
                  Step-by-Step Instructions
                </h2>
                <ol className="flex flex-col gap-5">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-4 rounded-lg2 bg-white p-5 shadow-[0_4px_16px_-6px_rgba(18,51,38,0.12)]">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-terracotta to-terracotta-dark text-[13px] font-bold text-white shadow-[0_4px_10px_-2px_rgba(210,98,44,0.4)]">
                        {i + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-[14.5px] leading-[1.7] text-ink">{step}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* ══════════════════════════════════════════
                6. NUTRITION VISUAL — bar chart style
            ══════════════════════════════════════════ */}
            {recipe.calories && (
              <div className="rounded-lg2 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(18,51,38,0.15)]">
                <h2 className="mb-1 font-display text-[20px] text-green-deep">Nutrition Facts</h2>
                <p className="mb-5 text-[12.5px] text-ink-soft">Per serving</p>

                {/* Calorie highlight */}
                <div className="mb-6 flex items-center gap-4 rounded-xl bg-gradient-to-r from-green-deep to-green-deeper p-4">
                  <span className="text-[40px]">🔥</span>
                  <div>
                    <div className="font-display text-[32px] font-bold text-white leading-none">{calories}</div>
                    <div className="text-[12px] text-white/60 uppercase tracking-wide">Calories</div>
                  </div>
                </div>

                {/* Macro bars */}
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'Protein',       value: recipe.protein_g,  unit: 'g',  max: 80,   color: 'bg-[#4caf50]' },
                    { label: 'Fat',           value: recipe.fat_g,      unit: 'g',  max: 100,  color: 'bg-terracotta' },
                    { label: 'Carbohydrates', value: recipe.carbs_g,    unit: 'g',  max: 150,  color: 'bg-gold' },
                    { label: 'Fiber',         value: recipe.fiber_g,    unit: 'g',  max: 40,   color: 'bg-[#81c784]' },
                    { label: 'Sugar',         value: recipe.sugar_g,    unit: 'g',  max: 80,   color: 'bg-[#e57373]' },
                    { label: 'Sodium',        value: recipe.sodium_mg,  unit: 'mg', max: 2300, color: 'bg-[#90a4ae]' },
                  ].filter(n => n.value).map(({ label, value, unit, max, color }) => (
                    <div key={label}>
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className="font-medium text-ink">{label}</span>
                        <span className="text-ink-soft">{Math.round(parseFloat(value!))} {unit}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-cream-2">
                        <div
                          className={`h-full rounded-full ${color} transition-all`}
                          style={{ width: `${getNutrientPercent(value, max)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                7. PRO TIPS
            ══════════════════════════════════════════ */}
            <div className="rounded-lg2 border-l-4 border-gold bg-white p-6 shadow-[0_8px_24px_-12px_rgba(18,51,38,0.15)]">
              <h2 className="mb-4 font-display text-[20px] text-green-deep">
                💡 Chef Tips
              </h2>
              <ul className="flex flex-col gap-3">
                {[
                  'Read through the full recipe before starting — it makes the process much smoother.',
                  'Prep all your ingredients before you begin cooking (mise en place).',
                  'Taste as you go and adjust seasoning to your preference.',
                  `This recipe serves ${recipe.servings ?? 'a few people'} — scale up or down as needed.`,
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-[14px] leading-[1.6] text-ink-soft">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gold/20 text-[10px] font-bold text-gold">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-6">

            {/* ══════════════════════════════════════════
                8. INGREDIENTS CHECKLIST
            ══════════════════════════════════════════ */}
            {recipe.ingredients?.length > 0 && (
              <div className="rounded-lg2 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(18,51,38,0.2)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-[20px] text-green-deep">Ingredients</h2>
                  <span className="rounded-full bg-cream-2 px-2.5 py-0.5 text-[12px] font-semibold text-green-deep">
                    {recipe.ingredients.length} items
                  </span>
                </div>
                <ul className="flex flex-col divide-y divide-cream-2">
                  {recipe.ingredients.map((ing) => (
                    <li key={ing.id} className="flex items-center gap-3 py-2.5">
                      {/* Checkbox dot */}
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-terracotta" />
                      <span className="flex-1 text-[13.5px] font-medium text-ink capitalize">{ing.name}</span>
                      <span className="text-[12.5px] text-ink-soft">
                        {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ══════════════════════════════════════════
                9. RECIPE AT A GLANCE
            ══════════════════════════════════════════ */}
            <div className="rounded-lg2 bg-gradient-to-br from-green-deep to-green-deeper p-6 text-white shadow-[0_8px_24px_-12px_rgba(18,51,38,0.4)]">
              <h2 className="mb-4 font-display text-[18px] text-white">At a Glance</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '🏷', label: 'Category',   value: recipe.category },
                  { icon: '⭐', label: 'Rating',     value: recipe.rating ? `${parseFloat(recipe.rating).toFixed(1)} / 5` : '—' },
                  { icon: '💬', label: 'Reviews',    value: recipe.review_count.toLocaleString() },
                  { icon: '🍽', label: 'Servings',   value: recipe.servings ? String(recipe.servings) : '—' },
                  { icon: '⏱', label: 'Prep Time',  value: parseDuration(recipe.prep_time) },
                  { icon: '🍳', label: 'Cook Time',  value: parseDuration(recipe.cook_time) },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="rounded-xl bg-white/10 px-3 py-2.5">
                    <div className="text-[14px]">{icon}</div>
                    <div className="mt-0.5 text-[13px] font-semibold text-white leading-tight">{value}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wide">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share / save strip */}
            <div className="rounded-lg2 bg-white p-5 shadow-[0_4px_16px_-6px_rgba(18,51,38,0.12)]">
              <p className="mb-3 text-[13px] font-semibold text-green-deep">Share this recipe</p>
              <div className="flex gap-2">
                {[
                  { label: 'Copy Link', icon: '🔗' },
                  { label: 'WhatsApp', icon: '💬' },
                  { label: 'Twitter',  icon: '𝕏' },
                ].map(({ label, icon }) => (
                  <button
                    key={label}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-cream-2 px-3 py-2 text-[12px] font-medium text-ink-soft hover:bg-cream-2 transition-colors"
                  >
                    <span>{icon}</span>
                    <span className="hidden sm:inline lg:hidden xl:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════
            10. RELATED RECIPES
        ══════════════════════════════════════════ */}
        {related.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-[24px] text-green-deep">You Might Also Like</h2>
              <Link href="/" className="text-[13px] font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {related.map(r => {
                const rImg = getImg(r.image_url, r.category)
                return (
                  <Link key={r.id} href={`/recipes/${r.id}`} className="group overflow-hidden rounded-lg2 bg-white shadow-[0_8px_24px_-12px_rgba(18,51,38,0.2)] transition-transform hover:-translate-y-1">
                    <div className="relative h-[160px] overflow-hidden">
                      <Image
                        src={rImg}
                        alt={r.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 33vw"
                        unoptimized={rImg.includes('sndimg.com')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className="absolute bottom-2 left-3 rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
                        {r.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 font-display text-[15px] text-green-deep line-clamp-1">{r.name}</h3>
                      <p className="mb-3 text-[12px] text-ink-soft line-clamp-1">{r.description}</p>
                      {r.rating && (
                        <span className="text-[12px] text-gold">
                          {starRating(r.rating)}
                          <span className="ml-1 text-[11px] text-ink-soft">({r.review_count.toLocaleString()})</span>
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════
          FOOTER BAR
      ══════════════════════════════════════════ */}
      <footer className="mt-10 bg-gradient-to-b from-green-deep to-green-deeper px-6 py-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-white mb-2">
          <Image src="/logo.jpeg" alt="FlavorFind" width={36} height={36} className="rounded-xl overflow-hidden" />
          <span className="font-display text-[15px] tracking-[2px]">FLAVOR FIND</span>
        </Link>
        <p className="text-[12px] text-white/40">© 2024 Flavor Find. All Rights Reserved.</p>
      </footer>

    </div>
  )
}
