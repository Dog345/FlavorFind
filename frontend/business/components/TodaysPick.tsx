'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

/* ─── types ──────────────────────────────────────────────────── */
interface Ingredient {
  id: string
  name: string
  category: string
  quantity: string
  unit: string
  sort_order: number
}

interface PickImage {
  url: string
  sort_order: number
}

interface DailyPick {
  id: string
  name: string
  category: string
  description: string
  prep_time: string
  cook_time: string
  total_time: string
  servings: number
  instructions: string[]
  keywords: string[]
  rating: string
  calories: string
  protein_g: string
  fat_g: string
  carbs_g: string
  ingredients: Ingredient[]
  images: PickImage[]
  image_url: string | null
  pick_date: string
  chef_note: string
}

/* ─── helpers ────────────────────────────────────────────────── */
function parseDuration(iso: string): string {
  if (!iso) return ''
  const h = iso.match(/(\d+)H/)?.[1]
  const m = iso.match(/(\d+)M/)?.[1]
  if (h && m) return `${h}h ${m}m`
  if (h)      return `${h}h`
  if (m)      return `${m} min`
  return iso
}

/* placeholder image slots when real images aren't uploaded yet */
const PLACEHOLDER_IMAGES = [
  'https://api.flavorfind.co.ke/storage/recipes/butter-chicken/butter-chicken-1.png',
  'https://api.flavorfind.co.ke/storage/recipes/butter-chicken/butter-chicken-2.png',
  'https://api.flavorfind.co.ke/storage/recipes/butter-chicken/butter-chicken-3.png',
]

/* ─── nutrition items ─────────────────────────────────────────── */
const NUTRITION_LABELS = [
  { key: 'calories',  label: 'Cal',      unit: ''   },
  { key: 'protein_g', label: 'Protein',  unit: 'g'  },
  { key: 'carbs_g',   label: 'Carbs',    unit: 'g'  },
  { key: 'fat_g',     label: 'Fat',      unit: 'g'  },
]

export default function TodaysPick() {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const [progress,  setProgress]  = useState(0)
  const [pick,      setPick]      = useState<DailyPick | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [tab,       setTab]       = useState<'ingredients' | 'steps'>('ingredients')
  const autoRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── fetch daily pick ── */
  useEffect(() => {
    fetch('https://api.flavorfind.co.ke/api/v1/recipes/daily-pick')
      .then(r => r.json())
      .then((data: DailyPick) => {
        setPick(data)
        setLoading(false)
      })
      .catch((e) => {
        console.error('TodaysPick fetch error:', e)
        setError(true)
        setLoading(false)
      })
  }, [])

  const [visible, setVisible] = useState(false)

  /* ── scroll progress ── */
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onScroll = () => {
      const raw = 1 - el.getBoundingClientRect().top / window.innerHeight
      setProgress(Math.max(0, Math.min(1, raw)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── intersection observer — makes section visible as soon as it enters viewport ── */
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.05 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  /* ── no auto-advance — user swipes manually ── */

  const goTo = (i: number, _imgCount?: number) => {
    setActiveImg(i)
  }

  const eased  = progress < 0.5 ? 2*progress*progress : 1 - Math.pow(-2*progress+2,2)/2
  void eased
  const fadeIn = {}

  /* build image list */
  const images = pick && pick.images && pick.images.length > 0
    ? pick.images
    : PLACEHOLDER_IMAGES.map((url, i) => ({ url, sort_order: i }))

  /* ── skeleton ── */
  if (loading) {
    return (
      <section className="relative w-full px-6 md:px-[100px] py-16 md:py-24 bg-[#0a1510]">
        <p className="text-[#e3c477] text-xs mb-4 tracking-widest uppercase">Loading Today&apos;s Pick…</p>
        <div className="flex flex-col md:flex-row gap-12 md:gap-16 animate-pulse">
          <div className="flex-1 flex flex-col gap-5">
            <div className="h-4 w-28 bg-[#1e3328] rounded-full" />
            <div className="h-8 w-3/4 bg-[#1e3328] rounded-lg" />
            <div className="h-4 w-full bg-[#1e3328] rounded" />
            <div className="h-4 w-5/6 bg-[#1e3328] rounded" />
          </div>
          <div className="flex-[1.2] aspect-square bg-[#152a1e] rounded-3xl" />
        </div>
      </section>
    )
  }

  if (error || !pick) {
    return (
      <section className="relative w-full px-6 md:px-[100px] py-16 bg-[#0a1510]">
        <p className="text-[#8a9e92] text-sm">Today&apos;s pick unavailable — check back soon.</p>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden">

      {/* ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 55% at 62% 50%, rgba(210,98,44,0.12) 0%, rgba(30,51,40,0.2) 45%, transparent 72%)' }} />

      <div className="relative z-10 w-full flex flex-col-reverse md:flex-row md:items-start gap-10 md:gap-16 px-6 md:px-[100px] py-16 md:py-24">

        {/* ── LEFT: recipe details ── */}
        <div className="flex-1 flex flex-col gap-6" style={fadeIn}>

          {/* eyebrow + date */}
          <div className="flex items-center gap-3">
            <span className="eyebrow">Today&apos;s Pick</span>
            <span className="text-[#8a9e92] text-[0.72rem] tracking-widest uppercase">
              {new Date(pick.pick_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </span>
          </div>

          {/* title */}
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.12] text-[#e8e2d4]">
            {pick.name}
          </h2>

          {/* tags */}
          <div className="flex flex-wrap gap-2">
            {(pick.keywords ?? []).slice(0, 5).map(k => (
              <span key={k} className="text-[0.72rem] text-[#8a9e92] border border-[#1e3328] px-3 py-1 rounded-full">
                {k}
              </span>
            ))}
          </div>

          {/* description */}
          <p className="text-[#8a9e92] text-[0.95rem] leading-relaxed max-w-[480px]">
            {pick.description}
          </p>

          {/* quick stats */}
          <div className="flex gap-6 flex-wrap">
            {[
              { label: 'Prep',     val: parseDuration(pick.prep_time)  },
              { label: 'Cook',     val: parseDuration(pick.cook_time)  },
              { label: 'Serves',   val: String(pick.servings)          },
              { label: 'Rating',   val: `★ ${Number(pick.rating).toFixed(1)}` },
            ].map(s => (
              <div key={s.label}>
                <div className="text-[#e8e2d4] text-[0.95rem] font-semibold">{s.val}</div>
                <div className="text-[#8a9e92] text-[0.68rem] tracking-widest uppercase mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* nutrition row */}
          <div className="flex gap-4 flex-wrap">
            {NUTRITION_LABELS.map(n => (
              <div key={n.key} className="bg-[#152a1e] border border-[#1e3328] rounded-xl px-4 py-2.5 text-center min-w-[64px]">
                <div className="text-[#e3c477] font-display text-[1rem] font-semibold leading-none">
                  {Math.round(Number(pick[n.key as keyof DailyPick] as string))}{n.unit}
                </div>
                <div className="text-[#8a9e92] text-[0.62rem] tracking-widest uppercase mt-1">{n.label}</div>
              </div>
            ))}
          </div>

          {/* chef note */}
          {pick.chef_note && (
            <div className="border-l-2 border-[#d2622c] pl-4">
              <p className="text-[#8a9e92] text-[0.88rem] italic leading-relaxed">&ldquo;{pick.chef_note}&rdquo;</p>
              <p className="text-[#e3c477] text-[0.68rem] tracking-widest uppercase mt-1.5">Chef&apos;s Note</p>
            </div>
          )}

          {/* tabs: ingredients / steps */}
          <div className="mt-2">
            <div className="flex gap-1 border-b border-[#1e3328] mb-5">
              {(['ingredients', 'steps'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2.5 px-1 mr-4 text-[0.82rem] tracking-widest uppercase transition-colors duration-200 border-b-2 -mb-px ${
                    tab === t
                      ? 'text-[#e3c477] border-[#e3c477]'
                      : 'text-[#8a9e92] border-transparent hover:text-[#e8e2d4]'
                  }`}
                >
                  {t === 'ingredients' ? `Ingredients (${(pick.ingredients ?? []).length})` : `Steps (${(pick.instructions ?? []).length})`}
                </button>
              ))}
            </div>

            {tab === 'ingredients' ? (
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                {(pick.ingredients ?? []).map(ing => (
                  <li key={ing.id} className="flex items-baseline gap-2 text-[0.85rem]">
                    <span className="text-[#d2622c] flex-shrink-0">•</span>
                    <span className="text-[#e8e2d4] capitalize">{ing.name}</span>
                    <span className="text-[#8a9e92] text-[0.75rem] ml-auto whitespace-nowrap">
                      {ing.quantity} {ing.unit}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <ol className="flex flex-col gap-3 max-h-[240px] overflow-y-auto pr-1">
                {(pick.instructions ?? []).map((step, i) => (
                  <li key={i} className="flex gap-3 text-[0.85rem]">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#d2622c] text-white text-[0.65rem] flex items-center justify-center font-semibold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[#8a9e92] leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* CTA */}
          <a
            href="https://flavorfind.co.ke"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 self-start flex items-center gap-2 bg-[#d2622c] text-white text-[0.85rem] tracking-[0.03em] px-7 py-[12px] rounded-full transition-all duration-200 hover:bg-[#e0703a] hover:-translate-y-px hover:shadow-[0_10px_26px_rgba(210,98,44,0.35)] active:scale-[0.97]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            Find More Like This
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

        {/* ── RIGHT: 5-image swiper ── */}
        <div
          className="flex-[1.2] flex flex-col items-center gap-4"
          style={{}}
        >
          {/* main image */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-[#1e3328]" style={{ aspectRatio: '4 / 3' }}>

            {images.map((img, i) => (
              <div
                key={i}
                className="absolute transition-opacity duration-700 inset-[40px]"
                style={{ opacity: i === activeImg ? 1 : 0, zIndex: i === activeImg ? 1 : 0 }}
              >
                <Image
                  src={img.url}
                  alt={`${pick.name} — angle ${i + 1}`}
                  fill
                  className="object-contain"
                  style={i === 0 ? { animation: 'imgSlowRotate 18s linear infinite', transformOrigin: 'center center' } : {}}
                  sizes="(max-width: 768px) 90vw, 600px"
                  priority={i === 0}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            ))}

            {/* left / right arrows */}
            <button
              onClick={() => goTo((activeImg - 1 + images.length) % images.length, images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[rgba(10,21,16,0.7)] border border-[#1e3328] flex items-center justify-center text-[#8a9e92] hover:text-[#e8e2d4] hover:border-[#e3c477] transition-all duration-200"
              aria-label="Previous image"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button
              onClick={() => goTo((activeImg + 1) % images.length, images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[rgba(10,21,16,0.7)] border border-[#1e3328] flex items-center justify-center text-[#8a9e92] hover:text-[#e8e2d4] hover:border-[#e3c477] transition-all duration-200"
              aria-label="Next image"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            {/* image counter badge */}
            <div className="absolute bottom-3 right-3 z-10 bg-[rgba(10,21,16,0.75)] border border-[#1e3328] text-[#8a9e92] text-[0.68rem] px-2.5 py-1 rounded-full backdrop-blur-sm">
              {activeImg + 1} / {images.length}
            </div>
          </div>

          {/* thumbnail strip */}
          <div className="flex gap-2.5 w-full justify-center">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => goTo(i, images.length)}
                className={`relative flex-shrink-0 w-[18%] rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  i === activeImg
                    ? 'border-[#e3c477] opacity-100'
                    : 'border-[#1e3328] opacity-50 hover:opacity-80 hover:border-[#e3c477]/50'
                }`}
                style={{ aspectRatio: '1 / 1' }}
                aria-label={`View angle ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={`${pick.name} thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                {/* placeholder when no image */}
                <div className="absolute inset-0 bg-[#152a1e] flex items-center justify-center -z-10">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3328" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* dot indicators */}
          <div className="flex gap-1.5 mt-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, images.length)}
                className={`rounded-full transition-all duration-300 ${
                  i === activeImg
                    ? 'w-5 h-1.5 bg-[#e3c477]'
                    : 'w-1.5 h-1.5 bg-[#1e3328] hover:bg-[#8a9e92]'
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* bottom divider */}
      <div className="w-full h-px bg-[#1e3328] mx-auto" style={{ maxWidth: 'calc(100% - 200px)' }} />

    </section>
  )
}
