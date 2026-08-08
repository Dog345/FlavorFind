'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Logo from './Logo';
import SearchBar from './SearchBar';

const NAV = [
  { href: '/',           label: 'Home' },
  { href: '/recipes',    label: 'Recipes' },
  { href: '/categories', label: 'Categories' },
  { href: '/about',      label: 'About' },
];

export default function Navbar() {
  const path = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-[#111]/95 backdrop-blur-md shadow-lg shadow-black/40' : 'bg-[#111]/80 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <Logo size={38} />
              <div className="leading-none">
                <span className="font-bold text-xl text-white">Flavor<span className="text-orange-500">Find</span></span>
                <p className="text-[10px] text-gray-500 tracking-widest uppercase">Discover &amp; Cook</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(l => (
                <Link key={l.href} href={l.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    path === l.href
                      ? 'text-orange-500 bg-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button onClick={() => setSearchOpen(v => !v)}
                className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-white/5 transition-colors">
                <i className={`fas ${searchOpen ? 'fa-times' : 'fa-search'} text-sm`}></i>
              </button>
              <Link href="/recipes"
                className="hidden md:flex btn-primary items-center gap-2 px-4 py-2 text-sm">
                <i className="fas fa-fire text-xs"></i> Find Recipes
              </Link>
              {/* Mobile hamburger */}
              <button onClick={() => setMobileOpen(v => !v)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <i className={`fas ${mobileOpen ? 'fa-times' : 'fa-bars'} text-sm`}></i>
              </button>
            </div>
          </div>

          {/* Search dropdown */}
          {searchOpen && (
            <div className="pb-4 fade-in">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                <SearchBar onSearch={() => setSearchOpen(false)} />
              </div>
            </div>
          )}

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden pb-4 fade-in">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-2">
                {NAV.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      path === l.href ? 'text-orange-500 bg-orange-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
