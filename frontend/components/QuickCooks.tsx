import QuickCooksCarousel from './QuickCooksCarousel'
import { getQuickRecipes, type Recipe } from '@/src/lib/api'

export default async function QuickCooks() {
  let recipes: Recipe[] = []
  try {
    recipes = await getQuickRecipes(20)
  } catch {
    // fail silently
  }

  if (recipes.length === 0) return null

  return (
    <section
      className="relative py-[80px] lg:pt-[110px] lg:pb-[30px] text-center overflow-hidden"
      style={{
        backgroundImage: 'url(/quick-bg.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay so text stays readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(10,28,20,0.82) 0%, rgba(10,28,20,0.75) 50%, rgba(10,28,20,0.88) 100%)' }}
      />

      <div className="relative mx-auto max-w-[1240px] px-8 mb-[50px]">
        {/* Eyebrow */}
        <div className="eyebrow justify-center !text-gold-light mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e3c477" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
          </svg>
          Ready in Under 60 Minutes
        </div>

        {/* Heading */}
        <h2 className="font-display text-[34px] text-white mb-3">
          Better in Under an Hour
        </h2>
        <p className="text-[15px] text-white/60 max-w-[500px] mx-auto leading-[1.7]">
          Delicious, fuss-free meals you can have on the table in less than an hour — perfect for any night of the week.
        </p>
      </div>

      {/* Sliding carousel — full bleed, no px padding */}
      <QuickCooksCarousel recipes={recipes} />

      {/* CTA */}
      <div className="mt-10 px-8">
        <a
          href="/recipes"
          className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-white/30 px-7 py-3 text-[14px] font-semibold text-white hover:bg-white/10 transition-colors"
        >
          Browse All Quick Recipes →
        </a>
      </div>
    </section>
  )
}
