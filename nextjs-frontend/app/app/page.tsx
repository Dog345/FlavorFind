'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AppPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const benefits = [
    { icon: '⚡', title: 'Lightning Fast', desc: 'Instant recipe search powered by AI' },
    { icon: '🔍', title: 'Smart Ingredients', desc: 'Find recipes based on what you have' },
    { icon: '❤️', title: 'Save Favorites', desc: 'Build your personal recipe collection' },
    { icon: '⏱️', title: 'Cook Timer', desc: 'Built-in timer for perfect timing' },
    { icon: '🌍', title: 'Global Cuisines', desc: 'Explore recipes from around the world' },
    { icon: '📱', title: 'Offline Ready', desc: 'Access saved recipes anywhere' },
  ];

  const features = [
    {
      icon: '🔥',
      title: 'Trending Recipes',
      desc: 'Discover what\'s popular this week with 15+ curated sections',
    },
    {
      icon: '🥘',
      title: 'Category Browse',
      desc: 'Browse by cuisine (Italian, Asian, Mexican...) or diet (Vegan, Gluten-free...)',
    },
    {
      icon: '👨‍🍳',
      title: 'Detailed Instructions',
      desc: 'Step-by-step cooking guide with ingredient scaling',
    },
    {
      icon: '🧂',
      title: 'Ingredient Picker',
      desc: 'Select from 100+ ingredients to find perfect recipe matches',
    },
    {
      icon: '💾',
      title: 'Save & Organize',
      desc: 'Save recipes and build your personal recipe library',
    },
    {
      icon: '🎯',
      title: 'Dietary Filters',
      desc: 'Filter by allergies, preferences, and cooking time',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah K.',
      role: 'Home Cook',
      text: 'FlavorFind helped me use up ingredients I had lying around. No more food waste!',
      avatar: '👩‍🍳',
    },
    {
      name: 'James M.',
      role: 'Busy Professional',
      text: 'I find delicious recipes in seconds. Perfect for quick weeknight dinners.',
      avatar: '👨‍💼',
    },
    {
      name: 'Maria G.',
      role: 'Food Blogger',
      text: 'The variety of cuisines is amazing. Great for discovering new recipes to feature.',
      avatar: '👩‍🎨',
    },
  ];

  const faqs = [
    {
      q: 'Is FlavorFind really free?',
      a: 'Yes! FlavorFind is completely free to use. No hidden charges, no premium subscriptions needed.',
    },
    {
      q: 'Do I need an account?',
      a: 'No account needed! Just download and start cooking. Your saved recipes are stored locally on your device.',
    },
    {
      q: 'How does ingredient search work?',
      a: 'Enter any ingredient (e.g., "chicken, rice, tomato") and we instantly find matching recipes from our database of 1000+ recipes.',
    },
    {
      q: 'Can I use it offline?',
      a: 'Yes! Saved recipes are stored on your device and accessible offline. New searches require internet.',
    },
    {
      q: 'What cuisines are available?',
      a: 'We have 14+ cuisines including Italian, Asian, Mexican, Indian, Mediterranean, French, Japanese, Chinese, Greek, Thai, Korean, and more!',
    },
    {
      q: 'How big is the app?',
      a: 'FlavorFind is ultra-lightweight at just 3.8MB! Perfect for devices with limited storage.',
    },
  ];

  return (
    <>
      {/* ── Hero Section ── */}
      <section className="hero-bg relative overflow-hidden" style={{ minHeight: '100vh' }}>
        <div className="absolute top-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center justify-center text-center py-20 md:py-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium px-4 py-2 rounded-full mb-6 fade-in">
            <i className="fas fa-mobile text-orange-500"></i> Now Available on Android
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-8xl font-extrabold leading-tight mb-6 fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="text-orange-500">FlavorFind</span><br />
            in Your Pocket
          </h1>

          {/* Subheading */}
          <p className="text-gray-400 text-lg md:text-2xl max-w-3xl mb-12 fade-in" style={{ animationDelay: '0.2s' }}>
            Get instant recipe suggestions based on ingredients you have. No waste. Pure flavor. Always with you.
          </p>

          {/* Download Button - HERO CTA */}
          <a
            href="/app/download"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 md:px-12 py-4 md:py-5 rounded-xl shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105 text-lg md:text-xl fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <i className="fas fa-download"></i>
            Download Free APK
            <span className="text-sm font-normal ml-2 opacity-90">(3.8 MB)</span>
          </a>

          {/* App Preview - Big Phone Image */}
          <div className="mt-16 fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="mx-auto max-w-sm relative">
              <div className="rounded-3xl overflow-hidden border-8 border-gray-800 bg-black shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1512941691920-25bda36dc643?w=500&q=80"
                  alt="FlavorFind App"
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-orange-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg">
                ⭐ 4.9 Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits Section ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Why You'll Love It</h2>
          <p className="text-gray-400 text-lg">Everything you need to cook amazing meals</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-orange-500/10 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/20"
            >
              <div className="text-5xl mb-4">{b.icon}</div>
              <h3 className="text-xl font-bold mb-2">{b.title}</h3>
              <p className="text-gray-400">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="bg-gradient-to-b from-gray-900/50 to-black/80 py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Packed with Features</h2>
            <p className="text-gray-400 text-lg">Everything from AI ingredient search to step-by-step guides</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <div key={i} className="flex gap-4 p-6 bg-gray-900/40 rounded-xl border border-gray-800 hover:border-orange-500/30 transition-all">
                <div className="text-4xl flex-shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-orange-500/5 border-y border-orange-500/20 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-orange-500">1000+</p>
              <p className="text-gray-400">Recipes</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-500">14+</p>
              <p className="text-gray-400">Cuisines</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-500">3.8 MB</p>
              <p className="text-gray-400">App Size</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-500">100%</p>
              <p className="text-gray-400">Free Forever</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Home Cooks</h2>
          <p className="text-gray-400 text-lg">Real users, real feedback</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 hover:border-orange-500/30 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{t.avatar}</span>
                <div>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-sm text-gray-400">{t.role}</p>
                </div>
              </div>
              <p className="text-gray-300 italic">"{t.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="bg-gradient-to-b from-black to-gray-900/80 py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">FAQ</h2>
            <p className="text-gray-400 text-lg">Common questions about FlavorFind</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden hover:border-orange-500/30 transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-all"
                >
                  <span className="font-bold text-lg text-left">{faq.q}</span>
                  <i className={`fas fa-chevron-down transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`}></i>
                </button>
                {expandedFaq === i && (
                  <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-800 text-gray-300">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-r from-orange-600/20 via-orange-500/10 to-orange-600/20 border-y border-orange-500/30 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Cook?</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Download FlavorFind now and start discovering amazing recipes based on ingredients you have.
          </p>
          <a
            href="/app/download"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-10 py-4 rounded-xl shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105 text-lg"
          >
            <i className="fas fa-download"></i>
            Download Now (Free)
          </a>
        </div>
      </section>
    </>
  );
}
