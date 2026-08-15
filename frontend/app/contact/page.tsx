'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { MailIcon } from '@/components/Icons'

const FAQ = [
  {
    q: 'Is FlavorFind free to use?',
    a: 'Yes, completely free. No account required, no subscriptions, no hidden fees.',
  },
  {
    q: 'How do I search for recipes by ingredient?',
    a: 'Go to the Recipes page, type an ingredient in the search bar and select it from the dropdown. You can add multiple ingredients to narrow down results.',
  },
  {
    q: 'How often is the recipe database updated?',
    a: 'Our recipe library is updated regularly with new dishes across all categories and cuisines.',
  },
  {
    q: 'Can I suggest a recipe or report an issue?',
    a: 'Absolutely! Send us an email at dallaherick0@gmail.com and we\'ll get back to you as soon as possible.',
  },
  {
    q: 'Does FlavorFind have a mobile app?',
    a: 'The website is fully responsive and works great on mobile browsers. A dedicated app may be coming in the future.',
  },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production this would POST to a backend or email service
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* ── Hero ── */}
      <div className="bg-gradient-to-b from-green-deep to-green-deeper px-6 py-16 text-center">
        <div className="mx-auto max-w-[560px]">
          <div className="eyebrow justify-center !text-gold-light mb-4">Get in Touch</div>
          <h1 className="font-display text-[36px] text-white md:text-[48px] leading-tight">
            We&apos;d Love to Hear From You
          </h1>
          <p className="mt-4 text-[14px] leading-[1.8] text-white/60">
            Have a question, suggestion, or just want to say hi? Drop us a message and
            we&apos;ll get back to you promptly.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-6 py-14 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">

          {/* ── Left: contact info ── */}
          <div className="flex flex-col gap-6">

            {/* Direct contact */}
            <div className="rounded-lg2 bg-white p-6 shadow-[0_4px_16px_-6px_rgba(18,51,38,0.12)]">
              <h2 className="mb-5 font-display text-[20px] text-green-deep">Contact Details</h2>
              <div className="flex flex-col gap-4">
                <a
                  href="mailto:dallaherick0@gmail.com"
                  className="flex items-center gap-3 rounded-xl border border-cream-2 p-4 hover:border-green-deep/30 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-deep/10">
                    <MailIcon className="h-5 w-5 stroke-green-deep" />
                  </div>
                  <div>
                    <div className="text-[12px] text-ink-soft uppercase tracking-wide">Email</div>
                    <div className="text-[14px] font-medium text-ink">dallaherick0@gmail.com</div>
                  </div>
                </a>
                <a
                  href="https://wa.me/254796605409"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-cream-2 p-4 hover:border-green-deep/30 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-deep/10">
                    <span className="text-[20px]">💬</span>
                  </div>
                  <div>
                    <div className="text-[12px] text-ink-soft uppercase tracking-wide">WhatsApp</div>
                    <div className="text-[14px] font-medium text-ink">+254 796 605 409</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Response time */}
            <div className="rounded-lg2 bg-gradient-to-br from-green-deep to-green-deeper p-6 text-white">
              <div className="text-[28px] mb-2">⏱</div>
              <h3 className="font-display text-[17px] mb-1">Response Time</h3>
              <p className="text-[13px] text-white/60 leading-[1.7]">
                We typically respond within <strong className="text-gold-light">24 hours</strong> on
                weekdays. For urgent matters, WhatsApp is the fastest way to reach us.
              </p>
            </div>

          </div>

          {/* ── Right: form ── */}
          <div className="rounded-lg2 bg-white p-8 shadow-[0_4px_16px_-6px_rgba(18,51,38,0.12)]">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="text-[56px] mb-4">🎉</div>
                <h2 className="font-display text-[24px] text-green-deep mb-2">Message Sent!</h2>
                <p className="text-[14px] text-ink-soft max-w-[320px]">
                  Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  className="mt-6 rounded-full border border-green-deep/20 px-6 py-2.5 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <>
                <h2 className="mb-6 font-display text-[20px] text-green-deep">Send a Message</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
                        Name
                      </label>
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Your name"
                        className="w-full rounded-xl border border-cream-2 bg-cream px-4 py-3 text-[13.5px] text-ink placeholder:text-ink-soft/50 outline-none focus:border-green-deep/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
                        Email
                      </label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full rounded-xl border border-cream-2 bg-cream px-4 py-3 text-[13.5px] text-ink placeholder:text-ink-soft/50 outline-none focus:border-green-deep/40 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
                      Subject
                    </label>
                    <input
                      required
                      type="text"
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="What's this about?"
                      className="w-full rounded-xl border border-cream-2 bg-cream px-4 py-3 text-[13.5px] text-ink placeholder:text-ink-soft/50 outline-none focus:border-green-deep/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Tell us how we can help…"
                      className="w-full rounded-xl border border-cream-2 bg-cream px-4 py-3 text-[13.5px] text-ink placeholder:text-ink-soft/50 outline-none focus:border-green-deep/40 transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-1 rounded-full bg-terracotta px-8 py-3.5 text-[14px] font-semibold text-white hover:bg-terracotta-dark transition-colors shadow-[0_8px_20px_-8px_rgba(210,98,44,0.5)]"
                  >
                    Send Message →
                  </button>
                </form>
              </>
            )}
          </div>

        </div>

        {/* ── FAQ ── */}
        <div className="mt-16">
          <div className="mb-8 text-center">
            <div className="eyebrow justify-center mb-3">FAQ</div>
            <h2 className="font-display text-[26px] text-green-deep">Frequently Asked Questions</h2>
          </div>
          <div className="mx-auto max-w-[760px] flex flex-col gap-3">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="rounded-lg2 bg-white shadow-[0_2px_12px_-4px_rgba(18,51,38,0.1)] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-display text-[15px] text-green-deep">{item.q}</span>
                  <span className={`ml-4 flex-shrink-0 text-[18px] text-terracotta transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-[13.5px] leading-[1.8] text-ink-soft">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  )
}
