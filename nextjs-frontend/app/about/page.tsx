import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium px-4 py-2 rounded-full mb-6">
          <i className="fas fa-info-circle"></i> About FlavorFind
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
          Cook Smarter,<br /><span className="text-orange-500">Eat Better</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          FlavorFind is an AI-powered recipe discovery platform that helps you find the perfect meal from ingredients you already have.
        </p>
      </div>

      {/* Mission cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {[
          { icon: 'fa-bullseye', title: 'Our Mission', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20',
            desc: 'Reduce food waste and make cooking accessible to everyone through intelligent recipe recommendations.' },
          { icon: 'fa-magic', title: 'How It Works', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20',
            desc: 'Enter your ingredients, our AI matches you with hundreds of recipes ranked by how well they fit what you have.' },
          { icon: 'fa-server', title: 'Technology', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20',
            desc: 'Built on Laravel + Next.js with Spoonacular API, smart key rotation, and response caching for instant results.' },
        ].map(c => (
          <div key={c.title} className={`bg-[#1a1a1a] border ${c.bg} rounded-2xl p-6`}>
            <div className={`w-12 h-12 rounded-xl ${c.bg} border flex items-center justify-center mb-4`}>
              <i className={`fas ${c.icon} ${c.color} text-xl`}></i>
            </div>
            <h3 className="font-bold text-white text-lg mb-2">{c.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-8 md:p-12 mb-16">
        <h2 className="section-title text-center mb-10 mx-auto" style={{ display: 'block' }}>By the Numbers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '1,050+', label: 'Searches/Day',   icon: 'fa-search' },
            { value: '7',      label: 'API Keys',        icon: 'fa-key' },
            { value: '25+',    label: 'Cuisines',        icon: 'fa-globe' },
            { value: '6–24hr', label: 'Cache TTL',       icon: 'fa-bolt' },
          ].map(s => (
            <div key={s.label}>
              <i className={`fas ${s.icon} text-orange-500 text-2xl mb-3 block`}></i>
              <p className="text-3xl font-extrabold text-white">{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to start cooking?</h2>
        <p className="text-gray-500 mb-6">Enter your ingredients and discover your next favourite meal.</p>
        <Link href="/recipes" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base">
          <i className="fas fa-fire"></i> Find Recipes Now
        </Link>
      </div>
    </div>
  );
}
