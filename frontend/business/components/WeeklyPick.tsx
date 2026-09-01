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

interface WeeklyFeature {
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
  video_url: string | null
  week_start: string
  week_end: string
  chef_note: string
  story: string
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

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`
}

const NUTRITION_LABELS = [
  { key: 'calories',  label: 'Cal',     unit: ''  },
  { key: 'protein_g', label: 'Protein', unit: 'g' },
  { key: 'carbs_g',   label: 'Carbs',   unit: 'g' },
  { key: 'fat_g',     label: 'Fat',     unit: 'g' },
]

export default function WeeklyPick() {
  const sectionRef    = useRef<HTMLDivElement>(null)
  const videoRef      = useRef<HTMLVideoElement>(null)
  const scrollStripRef = useRef<HTMLDivElement>(null)
  const mainVideoRef  = useRef<HTMLVideoElement>(null)
  const [feature,     setFeature]     = useState<WeeklyFeature | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(false)
  const [visible,     setVisible]     = useState(false)
  const [activeImg,   setActiveImg]   = useState(0)
  const [tab,         setTab]         = useState<'ingredients' | 'steps'>('ingredients')
  const [videoMode,   setVideoMode]   = useState(true)
  const [showingImages, setShowingImages] = useState(false)

  /* ── fetch ── */
  useEffect(() => {
    fetch('https://api.flavorfind.co.ke/api/v1/recipes/weekly-feature')
      .then(r => r.json())
      .then((data: WeeklyFeature) => { setFeature(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  /* ── intersection observer ── */
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

  /* ── autoplay video when visible ── */
  useEffect(() => {
    if (visible && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [visible])

  const images = feature && (feature.images ?? []).length > 0
    ? feature.images
    : []

  /* ── skeleton ── */
  if (loading) {
    return (
      <section className="relative w-full px-6 md:px-[100px] py-16 md:py-24 bg-[#0a1510]">
        <p className="text-[#e3c477] text-xs mb-4 tracking-widest uppercase animate-pulse">Loading This Week&apos;s Feature…</p>
        <div className="flex flex-col md:flex-row gap-12 animate-pulse">
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-4 w-32 bg-[#1e3328] rounded-full" />
            <div className="h-8 w-2/3 bg-[#1e3328] rounded-lg" />
            <div className="h-4 w-full bg-[#1e3328] rounded" />
            <div className="h-4 w-5/6 bg-[#1e3328] rounded" />
          </div>
          <div className="flex-[1.2]" style={{ aspectRatio: '16/9', background: '#152a1e', borderRadius: 16 }} />
        </div>
      </section>
    )
  }

  if (error || !feature) return null

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden bg-[#0a1510]">

      {/* top border */}
      <div className="w-full h-px bg-[#1e3328]" />

      {/* ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{
        background: 'radial-gradient(ellipse 65% 50% at 35% 50%, rgba(35,80,55,0.25) 0%, rgba(210,98,44,0.06) 50%, transparent 75%)',
        opacity: 1
      }} />

      <div className="relative z-10 w-full flex flex-col-reverse md:flex-row-reverse md:items-start gap-10 md:gap-16 px-6 md:px-[100px] py-16 md:py-24">

        {/* ── LEFT: recipe details ── */}
        <div
          className="flex-1 flex flex-col gap-6"
          style={{}}
        >
          {/* eyebrow + week range */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="eyebrow">This Week&apos;s Feature</span>
            <span className="text-[#8a9e92] text-[0.72rem] tracking-widest uppercase border border-[#1e3328] px-2.5 py-0.5 rounded-full">
              {formatWeekRange(feature.week_start, feature.week_end)}
            </span>
          </div>

          {/* title */}
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.12] text-[#e8e2d4]">
            {feature.name}
          </h2>

          {/* tags */}
          <div className="flex flex-wrap gap-2">
            {(feature.keywords ?? []).slice(0, 5).map(k => (
              <span key={k} className="text-[0.72rem] text-[#8a9e92] border border-[#1e3328] px-3 py-1 rounded-full">{k}</span>
            ))}
          </div>

          {/* story */}
          {feature.story && (
            <p className="text-[#8a9e92] text-[0.95rem] leading-relaxed max-w-[480px] italic border-l-2 border-[#235037] pl-4">
              {feature.story}
            </p>
          )}

          {/* description */}
          <p className="text-[#8a9e92] text-[0.92rem] leading-relaxed max-w-[480px]">
            {feature.description}
          </p>

          {/* quick stats */}
          <div className="flex gap-6 flex-wrap">
            {[
              { label: 'Prep',   val: parseDuration(feature.prep_time)  },
              { label: 'Cook',   val: parseDuration(feature.cook_time)  },
              { label: 'Serves', val: String(feature.servings)          },
              { label: 'Rating', val: `★ ${Number(feature.rating).toFixed(1)}` },
            ].map(s => (
              <div key={s.label}>
                <div className="text-[#e8e2d4] text-[0.95rem] font-semibold">{s.val}</div>
                <div className="text-[#8a9e92] text-[0.68rem] tracking-widest uppercase mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* nutrition */}
          <div className="flex gap-4 flex-wrap">
            {NUTRITION_LABELS.map(n => (
              <div key={n.key} className="bg-[#152a1e] border border-[#1e3328] rounded-xl px-4 py-2.5 text-center min-w-[64px]">
                <div className="text-[#e3c477] font-display text-[1rem] font-semibold leading-none">
                  {Math.round(Number(feature[n.key as keyof WeeklyFeature] as string))}{n.unit}
                </div>
                <div className="text-[#8a9e92] text-[0.62rem] tracking-widest uppercase mt-1">{n.label}</div>
              </div>
            ))}
          </div>

          {/* chef note */}
          {feature.chef_note && (
            <div className="border-l-2 border-[#d2622c] pl-4">
              <p className="text-[#8a9e92] text-[0.88rem] italic leading-relaxed">&ldquo;{feature.chef_note}&rdquo;</p>
              <p className="text-[#e3c477] text-[0.68rem] tracking-widest uppercase mt-1.5">Chef&apos;s Note</p>
            </div>
          )}

          {/* tabs */}
          <div className="mt-2">
            <div className="flex gap-1 border-b border-[#1e3328] mb-5">
              {(['ingredients', 'steps'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2.5 px-1 mr-4 text-[0.82rem] tracking-widest uppercase transition-colors duration-200 border-b-2 -mb-px ${
                    tab === t ? 'text-[#e3c477] border-[#e3c477]' : 'text-[#8a9e92] border-transparent hover:text-[#e8e2d4]'
                  }`}
                >
                  {t === 'ingredients' ? `Ingredients (${(feature.ingredients ?? []).length})` : `Steps (${(feature.instructions ?? []).length})`}
                </button>
              ))}
            </div>

            {tab === 'ingredients' ? (
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                {(feature.ingredients ?? []).map(ing => (
                  <li key={ing.id} className="flex items-baseline gap-2 text-[0.85rem]">
                    <span className="text-[#d2622c] flex-shrink-0">•</span>
                    <span className="text-[#e8e2d4] capitalize">{ing.name}</span>
                    <span className="text-[#8a9e92] text-[0.75rem] ml-auto whitespace-nowrap">{ing.quantity} {ing.unit}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ol className="flex flex-col gap-3 max-h-[240px] overflow-y-auto pr-1">
                {(feature.instructions ?? []).map((step, i) => (
                  <li key={i} className="flex gap-3 text-[0.85rem]">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#235037] text-white text-[0.65rem] flex items-center justify-center font-semibold mt-0.5">{i + 1}</span>
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
            className="mt-2 self-start flex items-center gap-2 bg-[#235037] text-white text-[0.85rem] tracking-[0.03em] px-7 py-[12px] rounded-full transition-all duration-200 hover:bg-[#2d6645] hover:-translate-y-px hover:shadow-[0_10px_26px_rgba(35,80,55,0.4)] active:scale-[0.97]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            Try This Recipe
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

        {/* ── RIGHT: video + images ── */}
        <div
          className="flex-[1.2] flex flex-col gap-4"
          style={{}}
        >
          {feature.video_url && (() => {
            const videos = [
              { src: feature.video_url!, label: 'Shakshuka in pan' },
              { src: feature.video_url!.replace('shakshuka1.mp4', 'shakshuka2.mp4'), label: 'Plating & serve' },
            ]
            return (
              <div className="flex flex-col gap-3">

                {/* ── horizontal scroll strip: video → images ── */}
                <div
                  ref={scrollStripRef}
                  className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory rounded-2xl"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {/* VIDEO slot */}
                  <div className="flex-shrink-0 w-full snap-start rounded-2xl overflow-hidden border border-[#1e3328] bg-[#0a1510] relative" style={{ aspectRatio: '16/9' }}>
                    <video
                      ref={mainVideoRef}
                      key={videoMode ? 'v0' : 'v1'}
                      src={videos[videoMode ? 0 : 1].src}
                      muted
                      playsInline
                      autoPlay
                      controls
                      className="w-full h-full object-cover"
                      onEnded={() => {
                        // scroll to first image when video finishes
                        if (scrollStripRef.current) {
                          const strip = scrollStripRef.current
                          const videoSlot = strip.firstElementChild as HTMLElement
                          strip.scrollTo({ left: videoSlot.offsetWidth + 16, behavior: 'smooth' })
                          setShowingImages(true)
                        }
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-[rgba(10,21,16,0.75)] border border-[#1e3328] text-[#e3c477] text-[0.68rem] tracking-widest uppercase px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {videos[videoMode ? 0 : 1].label}
                    </div>
                    {/* back button when images shown */}
                    {showingImages && (
                      <button
                        onClick={() => { scrollStripRef.current?.scrollTo({ left: 0, behavior: 'smooth' }); setShowingImages(false) }}
                        className="absolute bottom-3 right-3 bg-[rgba(10,21,16,0.8)] border border-[#1e3328] text-[#8a9e92] text-[0.65rem] px-3 py-1 rounded-full hover:border-[#e3c477] hover:text-[#e3c477] transition-all"
                      >
                        ← Video
                      </button>
                    )}
                  </div>

                  {/* IMAGE slots */}
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-full snap-start rounded-2xl overflow-hidden border border-[#1e3328] relative bg-[#0a1510]"
                      style={{ aspectRatio: '16/9' }}
                    >
                      <Image
                        src={img.url}
                        alt={`${feature.name} photo ${i + 1}`}
                        fill
                        className="object-contain p-6"
                        sizes="(max-width: 768px) 90vw, 600px"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      {/* counter */}
                      <div className="absolute bottom-3 right-3 bg-[rgba(10,21,16,0.75)] border border-[#1e3328] text-[#8a9e92] text-[0.65rem] px-2.5 py-1 rounded-full">
                        {i + 1} / {images.length}
                      </div>
                      {/* back to video */}
                      <button
                        onClick={() => { scrollStripRef.current?.scrollTo({ left: 0, behavior: 'smooth' }); setShowingImages(false) }}
                        className="absolute bottom-3 left-3 bg-[rgba(10,21,16,0.75)] border border-[#1e3328] text-[#8a9e92] text-[0.65rem] px-3 py-1 rounded-full hover:border-[#e3c477] hover:text-[#e3c477] transition-all"
                      >
                        ← Video
                      </button>
                    </div>
                  ))}
                </div>

                {/* dot indicators */}
                <div className="flex justify-center gap-2 mt-1">
                  {/* video dot */}
                  <button
                    onClick={() => { scrollStripRef.current?.scrollTo({ left: 0, behavior: 'smooth' }); setShowingImages(false) }}
                    className={`rounded-full transition-all duration-300 flex items-center gap-1 ${!showingImages ? 'bg-[#e3c477] px-3 py-1.5 text-[0.6rem] text-[#0a1510] font-semibold' : 'w-2 h-2 bg-[#1e3328] hover:bg-[#8a9e92]'}`}
                  >
                    {!showingImages ? '▶ Video' : ''}
                  </button>
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const strip = scrollStripRef.current
                        if (!strip) return
                        const videoSlot = strip.firstElementChild as HTMLElement
                        strip.scrollTo({ left: videoSlot.offsetWidth + 16 + i * (videoSlot.offsetWidth + 16), behavior: 'smooth' })
                        setShowingImages(true)
                      }}
                      className={`rounded-full transition-all duration-300 ${showingImages ? 'w-2 h-2 bg-[#e3c477]' : 'w-2 h-2 bg-[#1e3328] hover:bg-[#8a9e92]'}`}
                      aria-label={`Photo ${i + 1}`}
                    />
                  ))}
                </div>

                {/* hanging second video */}
                <div className="flex justify-center mt-1">
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-3 rounded-full border border-[#e3c477]/40 bg-[#152a1e]" />
                    <div className="w-px h-8 bg-[#e3c477]/30" />
                    <button
                      onClick={() => setVideoMode(v => !v)}
                      className="relative rounded-xl overflow-hidden border-2 border-[#e3c477]/40 hover:border-[#e3c477] transition-all duration-200 group shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                      style={{ width: 200, height: 200, animation: 'hangingSway 4s ease-in-out infinite', transformOrigin: 'top center' }}
                      aria-label="Play second video"
                    >
                      <video src={videos[videoMode ? 1 : 0].src} muted playsInline className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-200" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[rgba(10,21,16,0.85)] border border-[#e3c477]/60 flex items-center justify-center group-hover:border-[#e3c477] group-hover:scale-110 transition-all duration-200">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#e3c477" stroke="none"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                        <span className="bg-[rgba(10,21,16,0.8)] text-[#8a9e92] text-[0.6rem] tracking-widest uppercase px-2 py-0.5 rounded-full">
                          {videos[videoMode ? 1 : 0].label}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            )
          })()}
        </div>
      </div>

      {/* bottom border */}
      <div className="w-full h-px bg-[#1e3328]" />

    </section>
  )
}
