import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LeafIcon, StarBurst } from '@/components/Icons'
import { getCategories } from '@/src/lib/api'

const TEAM = [
  { name: 'Erick Dallah', role: 'Founder & Lead Developer', emoji: '👨‍💻' },
  { name: 'The FlavorFind Team', role: 'Recipe Curators', emoji: '👨‍🍳' },
]

const VALUES = [
  {
    emoji: '🥦',
    title: 'Use What You Have',
    desc: 'No more wasted groceries. Search by the ingredients already in your fridge and pantry.',
  },
  {
    emoji: '⚡',
    title: 'Fast & Simple',
    desc: 'Results in seconds. No sign-up required, no ads, no clutter — just recipes.',
  },
  {
    emoji: '🍽',
    title: 'Thousands of Recipes',
    desc: 'A growing library across every cuisine, diet, and meal type imaginable.',
  },
  {
    emoji: '📱',
    title: 'Works Everywhere',
    desc: 'Optimised for mobile, tablet and desktop so you can cook from any device.',
  },
]

export default async function AboutPage() {
  // Fetch real counts from the API
  let totalRecipes = 0
  let totalCategories = 0
  try {
    const data = await getCategories()
    totalCategories = data.categories.length
    totalRecipes = data.categories.reduce((sum, c) => sum + c.recipe_count, 0)
  } catch { /* fallback to 0 */ }

  const stats = [
    { value: totalRecipes > 0 ? totalRecipes.toLocaleString() : '—', label: 'Recipes' },
    { value: totalCategories > 0 ? String(totalCategories) : '—', label: 'Categories' },
    { value: '2,000+', label: 'Ingredients' },
    { value: '100%', label: 'Free' },
  ]
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* ── Hero ── */}
      <div className="bg-gradient-to-b from-green-deep to-green-deeper px-6 py-16 text-center">
        <div className="mx-auto max-w-[680px]">
          <div className="eyebrow justify-center !text-gold-light mb-4">
            Our Story
          </div>
          <h1 className="font-display text-[36px] text-white md:text-[52px] leading-tight">
            Cooking Starts With{' '}
            <span className="text-gold-light">What You Have</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[480px] text-[15px] leading-[1.8] text-white/60">
            FlavorFind was built for home cooks who want to make great food without
            extra shopping trips. Enter your ingredients — we handle the rest.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-6 py-14 md:px-8">

        {/* ── Mission ── */}
        <div className="mb-16 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="eyebrow mb-3">
              <StarBurst className="h-4 w-4 fill-terracotta" />
              Our Mission
            </div>
            <h2 className="font-display text-[28px] text-green-deep md:text-[34px] leading-tight mb-4">
              Reduce Food Waste, One Recipe at a Time
            </h2>
            <p className="text-[14.5px] leading-[1.8] text-ink-soft mb-4">
              Every year, households throw away food that could have been turned into
              a delicious meal. FlavorFind connects the dots between what&apos;s in
              your kitchen and the recipes that match — helping you cook smarter, save
              money, and waste less.
            </p>
            <p className="text-[14.5px] leading-[1.8] text-ink-soft">
              We believe great cooking shouldn&apos;t require a special trip to the
              grocery store. With thousands of recipes spanning every cuisine and
              dietary preference, there&apos;s always something amazing you can make
              right now.
            </p>
          </div>
          <div className="rounded-lg2 bg-gradient-to-br from-green-deep to-green-deeper p-8 text-white text-center">
            <LeafIcon className="mx-auto mb-4 h-16 w-16 stroke-gold-light" />
            <div className="font-display text-[22px] tracking-[2px] mb-1">FLAVOR FIND</div>
            <div className="text-[12px] tracking-[3px] text-gold-light uppercase mb-6">Discover · Cook · Enjoy</div>
            <div className="grid grid-cols-2 gap-4 text-center">
              {stats.map(stat => (
                <div key={stat.label} className="rounded-xl bg-white/10 py-3 px-2">
                  <div className="font-display text-[22px] text-gold-light">{stat.value}</div>
                  <div className="text-[11px] text-white/50 uppercase tracking-wide mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Values ── */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <div className="eyebrow justify-center mb-3">What We Stand For</div>
            <h2 className="font-display text-[26px] text-green-deep md:text-[32px]">Built Around You</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(v => (
              <div
                key={v.title}
                className="rounded-lg2 bg-white p-6 shadow-[0_4px_16px_-6px_rgba(18,51,38,0.12)] border border-cream-2"
              >
                <div className="mb-3 text-[36px]">{v.emoji}</div>
                <h3 className="mb-2 font-display text-[16px] text-green-deep">{v.title}</h3>
                <p className="text-[13px] leading-[1.7] text-ink-soft">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="mb-16 rounded-lg2 bg-white p-8 shadow-[0_4px_16px_-6px_rgba(18,51,38,0.12)]">
          <div className="mb-8 text-center">
            <div className="eyebrow justify-center mb-3">How It Works</div>
            <h2 className="font-display text-[26px] text-green-deep">Three Steps to Your Next Meal</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Add Your Ingredients', desc: 'Type what you have in your kitchen — chicken, garlic, pasta, anything.' },
              { step: '02', title: 'Discover Recipes', desc: 'We instantly match your ingredients to thousands of curated recipes.' },
              { step: '03', title: 'Start Cooking', desc: 'Follow the step-by-step instructions and enjoy your meal.' },
            ].map(s => (
              <div key={s.step} className="flex gap-4">
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-green-deep text-[13px] font-bold text-white">
                  {s.step}
                </div>
                <div>
                  <h3 className="mb-1 font-display text-[16px] text-green-deep">{s.title}</h3>
                  <p className="text-[13px] leading-[1.7] text-ink-soft">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Team ── */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <div className="eyebrow justify-center mb-3">The People</div>
            <h2 className="font-display text-[26px] text-green-deep">Behind FlavorFind</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {TEAM.map(t => (
              <div key={t.name} className="flex flex-col items-center rounded-lg2 bg-white px-8 py-6 text-center shadow-[0_4px_16px_-6px_rgba(18,51,38,0.12)] min-w-[180px]">
                <div className="mb-3 text-[48px]">{t.emoji}</div>
                <div className="font-display text-[15px] text-green-deep">{t.name}</div>
                <div className="mt-1 text-[12px] text-ink-soft">{t.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="rounded-lg2 bg-gradient-to-br from-green-deep to-green-deeper px-8 py-10 text-center text-white">
          <h2 className="font-display text-[26px] text-white mb-2">Ready to Cook Something Amazing?</h2>
          <p className="mx-auto mb-6 max-w-[420px] text-[14px] text-white/60">
            Start exploring thousands of recipes — completely free, no sign-up needed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/recipes"
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-7 py-3.5 text-[14px] font-semibold text-white hover:bg-terracotta-dark transition-colors"
            >
              Search Recipes →
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-[14px] font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  )
}
