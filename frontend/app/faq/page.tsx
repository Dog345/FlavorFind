'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const FAQ_GROUPS = [
  {
    group: 'Using FlavorFind',
    emoji: '🔍',
    items: [
      {
        q: 'What is FlavorFind?',
        a: 'FlavorFind is a free recipe discovery platform that lets you search for recipes based on the ingredients you already have at home. Type in what\'s in your fridge or pantry and we\'ll find matching recipes instantly.',
      },
      {
        q: 'How do I search for recipes by ingredient?',
        a: 'Go to the Recipes page, click the search bar, and start typing an ingredient (e.g. "chicken"). Select it from the autocomplete dropdown. You can add multiple ingredients to refine your results. Recipes that match more of your ingredients appear first.',
      },
      {
        q: 'Can I search with multiple ingredients?',
        a: 'Yes! Add as many ingredients as you like. Each ingredient you add narrows the results to recipes that use those ingredients. You can remove any ingredient by clicking the × next to it.',
      },
      {
        q: 'How do I filter recipes by category?',
        a: 'On the Recipes page, category filter chips appear below the search bar. Click any category (e.g. "Chicken", "Pasta", "Dessert") to filter results. Click again to deselect.',
      },
      {
        q: 'What does the "You Might Also Like" section show?',
        a: 'At the bottom of each recipe page, we suggest 3 related recipes from the same category to help you discover more dishes you\'ll enjoy.',
      },
    ],
  },
  {
    group: 'Recipes & Content',
    emoji: '🍽',
    items: [
      {
        q: 'Where do the recipes come from?',
        a: 'Our recipe library is sourced from Spoonacular, a comprehensive food and recipe database, as well as curated community recipes. We cover everything from quick weeknight dinners to elaborate weekend feasts.',
      },
      {
        q: 'Are the nutritional values accurate?',
        a: 'Nutritional information is provided for informational purposes and is calculated based on standard ingredient quantities. Values may vary depending on specific brands, preparation methods, and portion sizes. Always consult a nutritionist or dietitian for medical dietary needs.',
      },
      {
        q: 'How many recipes does FlavorFind have?',
        a: 'We have over 500,000 recipes across 300+ categories. Our library is continuously growing.',
      },
      {
        q: 'Can I save or bookmark recipes?',
        a: 'This feature is coming soon. For now, you can bookmark recipe pages in your browser or share the link using the share buttons on any recipe page.',
      },
      {
        q: 'The recipe image is missing or broken. What should I do?',
        a: 'If a recipe image doesn\'t load, we automatically show a category fallback image. If you notice a persistent issue, feel free to report it via our Contact page.',
      },
    ],
  },
  {
    group: 'Account & Privacy',
    emoji: '🔒',
    items: [
      {
        q: 'Do I need an account to use FlavorFind?',
        a: 'No. FlavorFind is completely free and requires no registration or sign-in. Just open the site and start searching.',
      },
      {
        q: 'Does FlavorFind collect my data?',
        a: 'We collect minimal anonymous data to improve the service (such as popular search terms). We do not collect personal information without your consent, and we never sell your data. See our Privacy Policy for full details.',
      },
      {
        q: 'How does FlavorFind use cookies?',
        a: 'We use essential cookies to make the site work, and optional analytics cookies to understand usage patterns. No advertising or tracking cookies are used. You can manage cookies in your browser settings.',
      },
      {
        q: 'Is my contact form data stored?',
        a: 'Messages sent via our contact form are used only to respond to your enquiry and are not shared with third parties.',
      },
    ],
  },
  {
    group: 'Technical & Compatibility',
    emoji: '⚙️',
    items: [
      {
        q: 'Which browsers are supported?',
        a: 'FlavorFind works on all modern browsers including Chrome, Firefox, Safari, Edge, and Opera. We recommend keeping your browser up to date for the best experience.',
      },
      {
        q: 'Does FlavorFind work on mobile?',
        a: 'Yes! FlavorFind is fully responsive and optimised for mobile phones and tablets. The site works great in any mobile browser.',
      },
      {
        q: 'The site is loading slowly. What can I do?',
        a: 'Recipe data is fetched live from our API. On a slow connection, results may take a few seconds. Try refreshing the page. If slowness persists, please contact us so we can investigate.',
      },
      {
        q: 'I found a bug. How do I report it?',
        a: 'Please email us at dallaherick0@gmail.com with a description of the issue, the page it occurred on, and your browser/device. Screenshots are very helpful!',
      },
    ],
  },
]

export default function FAQPage() {
  const [open, setOpen] = useState<string | null>(null)

  const toggle = (key: string) => setOpen(prev => prev === key ? null : key)

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-b from-green-deep to-green-deeper px-6 py-14 text-center">
        <div className="mx-auto max-w-[600px]">
          <div className="eyebrow justify-center !text-gold-light mb-4">Help Centre</div>
          <h1 className="font-display text-[36px] text-white md:text-[48px]">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-[14px] leading-[1.8] text-white/60">
            Everything you need to know about FlavorFind. Can&apos;t find your answer?{' '}
            <Link href="/contact" className="text-gold-light hover:underline">Contact us</Link>.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-6 py-14 md:px-8">

        {FAQ_GROUPS.map(group => (
          <div key={group.group} className="mb-12">
            <div className="mb-5 flex items-center gap-3">
              <span className="text-[24px]">{group.emoji}</span>
              <h2 className="font-display text-[22px] text-green-deep">{group.group}</h2>
              <div className="flex-1 h-px bg-cream-2" />
            </div>
            <div className="flex flex-col gap-3">
              {group.items.map((item, i) => {
                const key = `${group.group}-${i}`
                const isOpen = open === key
                return (
                  <div
                    key={key}
                    className="rounded-lg2 bg-white shadow-[0_2px_12px_-4px_rgba(18,51,38,0.1)] overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="flex w-full items-start justify-between px-6 py-4 text-left gap-4"
                      aria-expanded={isOpen}
                    >
                      <span className="font-display text-[15px] text-green-deep leading-snug">{item.q}</span>
                      <span
                        className={`mt-0.5 flex-shrink-0 text-[20px] font-light text-terracotta transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
                      >
                        +
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 text-[13.5px] leading-[1.8] text-ink-soft border-t border-cream-2 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Still have questions CTA */}
        <div className="rounded-lg2 bg-gradient-to-br from-green-deep to-green-deeper px-8 py-10 text-center text-white">
          <div className="text-[36px] mb-3">💬</div>
          <h2 className="font-display text-[22px] text-white mb-2">Still Have Questions?</h2>
          <p className="mx-auto mb-6 max-w-[380px] text-[13.5px] text-white/60">
            We&apos;re happy to help. Reach out and we&apos;ll get back to you within 24 hours.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-7 py-3 text-[13.5px] font-semibold text-white hover:bg-terracotta-dark transition-colors"
            >
              Contact Us →
            </Link>
            <a
              href="mailto:dallaherick0@gmail.com"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-[13.5px] font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>

        {/* Related links */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/privacy" className="rounded-full border border-green-deep/20 px-5 py-2 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors">
            Privacy Policy →
          </Link>
          <Link href="/terms" className="rounded-full border border-green-deep/20 px-5 py-2 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors">
            Terms of Use →
          </Link>
        </div>

      </div>

      <Footer />
    </div>
  )
}
