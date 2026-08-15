'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LeafIcon, SearchIcon } from './Icons'

const NAV_LINKS = [
  { label: 'Home',       href: '/' },
  { label: 'Recipes',    href: '/recipes' },
  { label: 'Categories', href: '/categories' },
  { label: 'About',      href: '/about' },
  { label: 'Contact',    href: '/contact' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-green-deep/95 backdrop-blur-sm px-6 py-4 shadow-md">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <LeafIcon className="h-7 w-7 stroke-gold-light" />
          <div>
            <div className="font-display text-[16px] tracking-[2px] text-white leading-none">FLAVOR FIND</div>
            <div className="text-[8px] tracking-[3px] text-gold-light uppercase">Recipes</div>
          </div>
        </Link>

        {/* Nav links — desktop */}
        <ul className="hidden items-center gap-8 text-[14px] text-[#efe9da] md:flex">
          {NAV_LINKS.map(link => {
            const isActive = link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href) && link.href !== '/'
            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={`relative pb-1.5 transition-colors hover:text-gold-light ${
                    isActive
                      ? 'text-gold-light after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-gold-light'
                      : ''
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* CTA */}
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(210,98,44,0.55)] transition-transform hover:-translate-y-0.5 hover:bg-terracotta-dark"
        >
          <SearchIcon className="h-3.5 w-3.5 stroke-white" />
          <span className="hidden sm:inline">Search Recipes</span>
          <span className="sm:hidden">Search</span>
        </Link>

      </div>
    </nav>
  )
}
