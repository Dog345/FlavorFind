import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#0a0a0a', borderTop: '1px solid #1e1e1e' }} className="mt-20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Logo size={36} />
              <div>
                <span className="font-bold text-lg text-white">Flavor<span className="text-orange-500">Find</span></span>
                <p className="text-[10px] text-gray-600 tracking-widest uppercase">Discover &amp; Cook</p>
              </div>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              Discover amazing recipes based on your ingredients. Cook smarter, eat better, waste less.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Navigate</h4>
            <ul className="space-y-3">
              {[['/', 'Home'], ['/recipes', 'Recipes'], ['/categories', 'Categories'], ['/about', 'About']].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-gray-500 text-sm hover:text-orange-500 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cuisines */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Popular Cuisines</h4>
            <ul className="space-y-3">
              {['Italian', 'Mexican', 'Asian', 'African', 'Mediterranean'].map(c => (
                <li key={c}>
                  <Link href={`/categories?type=cuisine&value=${c}`} className="text-gray-500 text-sm hover:text-orange-500 transition-colors">{c}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Contact</h4>
            <a href="https://api.whatsapp.com/send/?phone=254796605409"
              className="flex items-center gap-3 text-gray-500 text-sm hover:text-green-400 transition-colors mb-3">
              <i className="fab fa-whatsapp text-green-500"></i> 0796605409
            </a>
            <div className="flex gap-3 mt-4">
              {[
                { icon: 'fa-github',    href: '#' },
                { icon: 'fa-twitter',   href: '#' },
                { icon: 'fa-instagram', href: '#' },
              ].map(s => (
                <a key={s.icon} href={s.href}
                  className="w-9 h-9 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-500 hover:text-orange-500 hover:border-orange-500/50 transition-all">
                  <i className={`fab ${s.icon} text-sm`}></i>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#1e1e1e] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">&copy; 2024 FlavorFind. All Rights Reserved.</p>
          <p className="text-gray-700 text-xs">Discover · Cook · Enjoy</p>
        </div>
      </div>
    </footer>
  );
}
