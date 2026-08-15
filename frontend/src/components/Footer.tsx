'use client'

import Link from 'next/link'
import { Mail, MessageCircle, ExternalLink, Code2 } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const sections = [
    {
      title: 'Product',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Recipes', href: '/recipes' },
        { label: 'Categories', href: '/categories' },
        { label: 'About', href: '/about' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Use', href: '/terms' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Connect',
      links: [
        { label: 'GitHub', href: 'https://github.com' },
        { label: 'Email', href: 'mailto:dallaherick0@gmail.com' },
        { label: 'WhatsApp', href: 'https://wa.me/254796605409' },
      ],
    },
  ]

  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <div>
                <h3 className="font-bold text-white">Flavor Find</h3>
                <p className="text-xs text-gray-500">Discover & Cook</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Discover amazing recipes based on ingredients you already have.
            </p>
            <div className="flex gap-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-orange-600 rounded-lg transition-colors"
              >
                <Code2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith('http') || link.href.startsWith('mailto') || link.href.startsWith('https://wa.me') ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-orange-600 transition-colors flex items-center gap-1"
                      >
                        {link.label}
                        {(link.href.startsWith('http') || link.href.startsWith('https://wa.me')) && link.href !== '/' && (
                          <ExternalLink className="w-3 h-3" />
                        )}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-orange-600 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="divider mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {currentYear} Flavor Find. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:dallaherick0@gmail.com"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-600 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
            <a
              href="https://wa.me/254796605409"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
