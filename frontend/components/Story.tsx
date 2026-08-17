import Image from 'next/image'
import { StarBurst } from './Icons'

export default function Story() {
  return (
    <section className="px-8 pb-[100px] pt-10" id="story">
      <div className="mx-auto max-w-[1240px] grid grid-cols-1 items-center gap-[60px] md:grid-cols-[0.95fr_1.05fr]">

        {/* Left — main image */}
        <div className="relative">
          <div className="relative w-full h-[380px] rounded-lg2 overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80"
              alt="Fresh ingredients and recipe preparation"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Right — text content */}
        <div>
          <div className="eyebrow justify-start">
            <StarBurst className="h-4 w-4 fill-terracotta" />
            Our Story
          </div>
          <h2 className="mb-[18px] font-display text-[32px] leading-[1.25] text-green-deep">
            Welcome to Flavor Find
          </h2>
          <p className="mb-5 text-[15px] leading-[1.8] text-ink-soft">
            At Flavor Find, we believe that great cooking starts with what you already have.
            Our platform helps you discover delicious recipes based on the ingredients in your
            fridge — no more last-minute grocery runs or wasted food.
          </p>
          <p className="mb-[26px] text-[15px] leading-[1.8] text-ink-soft">
            Whether you&apos;re a beginner or a seasoned home cook, Flavor Find makes meal
            planning effortless with thousands of recipes across every cuisine and diet type.
            Just tell us what&apos;s in your kitchen, and we&apos;ll handle the rest.
          </p>
          <a
            href="/recipes"
            className="btn btn-outline-green btn-small inline-flex items-center gap-2 rounded-full border border-green-deep px-[18px] py-[9px] text-[12.5px] font-semibold text-green-deep hover:bg-green-deep hover:text-white transition-colors"
          >
            Start Exploring →
          </a>
        </div>

      </div>
    </section>
  )
}
