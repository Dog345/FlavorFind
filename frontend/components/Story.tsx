import Image from 'next/image'
import { StarBurst } from './Icons'

export default function Story() {
  return (
    <section className="px-8 pb-[100px] pt-10 bg-dark-surface" id="story">
      <div className="mx-auto max-w-[1240px] grid grid-cols-1 items-center gap-[60px] md:grid-cols-[0.95fr_1.05fr]">

        {/* Left — main image + overlapping chef portrait */}
        <div className="relative">
          <div className="relative w-full h-[380px] rounded-lg2 overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80"
              alt="Home cook preparing a meal"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {/* Overlapping small portrait — bottom left */}
          <div className="absolute -bottom-[30px] left-[40px] h-[120px] w-[120px] rounded-full overflow-hidden border-[6px] border-dark-surface shadow-[0_14px_30px_-10px_rgba(0,0,0,0.5)]">
            <Image
              src="https://images.unsplash.com/photo-1607631568010-a87245c0daf0?w=300&q=80"
              alt="Happy home cook"
              fill
              className="object-cover"
              sizes="120px"
            />
          </div>
        </div>

        {/* Right — text content */}
        <div>
          <div className="eyebrow justify-start">
            <StarBurst className="h-4 w-4 fill-terracotta" />
            Our Story
          </div>
          <h2 className="mb-[18px] font-display text-[32px] leading-[1.25] text-dark-text">
            Welcome to Flavor Find
          </h2>
          <p className="mb-5 text-[15px] leading-[1.8] text-dark-muted">
            At Flavor Find, we believe that great cooking starts with what you already have.
            Our platform helps you discover delicious recipes based on the ingredients in your
            fridge — no more last-minute grocery runs or wasted food.
          </p>
          <p className="mb-[26px] text-[15px] leading-[1.8] text-dark-muted">
            Whether you&apos;re a beginner or a seasoned home cook, Flavor Find makes meal
            planning effortless with thousands of recipes across every cuisine and diet type.
            Just tell us what&apos;s in your kitchen, and we&apos;ll handle the rest.
          </p>
          <a
            href="#dishes"
            className="btn btn-outline-green btn-small inline-flex items-center gap-2 rounded-full border border-gold-light/50 px-[18px] py-[9px] text-[12.5px] font-semibold text-gold-light hover:bg-gold-light/10 transition-colors"
          >
            Start Exploring →
          </a>
        </div>

      </div>
    </section>
  )
}
