"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MailIcon,
  SendIcon,
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  YoutubeIcon,
} from "./Icons";

const EXPLORE_LINKS = [
  { label: "Recipes",              href: "/recipes" },
  { label: "Categories",           href: "/categories" },
  { label: "Search by Ingredient", href: "/recipes" },
  { label: "FAQ",                  href: "/faq" },
];

const COMPANY_LINKS = [
  { label: "About Us",       href: "/about" },
  { label: "Contact",        href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use",   href: "/terms" },
];

export default function Footer() {
  return (
    <footer
      id="footer"
      className="bg-gradient-to-b from-green-deep to-green-deeper px-8 pb-[26px] pt-[50px] text-[#e7e2d4]"
    >
      <div className="mx-auto max-w-[1240px]">

        {/* Main grid — on mobile: brand full width, then explore+company side by side, newsletter full width */}
        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">

          {/* Brand — always full width on mobile */}
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <Image src="/logo.jpeg" alt="FlavorFind" width={40} height={40} className="rounded-xl overflow-hidden" />
              <span className="font-display text-[17px] tracking-[1px] text-white">
                FLAVOR FIND
              </span>
            </div>
            <p className="mb-4 text-[13px] leading-[1.7] text-[#b7c0b6]">
              Discover delicious recipes based on ingredients you already have.
              Cook more, waste less.
            </p>
            {/* Contact line — visible on mobile */}
            <p className="mb-4 flex items-center gap-2 text-[13px] text-[#b7c0b6] lg:hidden">
              <MailIcon className="h-[14px] w-[14px] flex-shrink-0 stroke-gold-light" />
              dallaherick0@gmail.com
            </p>
            <div className="flex gap-2.5">
              {[InstagramIcon, FacebookIcon, TwitterIcon, YoutubeIcon].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/25 hover:border-white/60 transition-colors"
                >
                  <Icon className="h-[15px] w-[15px] stroke-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore + Company — side by side on mobile */}
          <div className="grid grid-cols-2 gap-6 lg:contents">

            {/* Explore */}
            <div>
              <h5 className="mb-4 text-[13px] font-semibold uppercase tracking-[1px] text-white">
                Explore
              </h5>
              <ul className="flex flex-col gap-2.5">
                {EXPLORE_LINKS.map(l => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[13.5px] text-[#b7c0b6] hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h5 className="mb-4 text-[13px] font-semibold uppercase tracking-[1px] text-white">
                Company
              </h5>
              <ul className="flex flex-col gap-2.5">
                {COMPANY_LINKS.map(l => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[13.5px] text-[#b7c0b6] hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Newsletter — full width on mobile */}
          <div>
            <h5 className="mb-4 text-[13px] font-semibold uppercase tracking-[1px] text-white">
              Newsletter
            </h5>
            <p className="mb-3 text-[13px] leading-[1.7] text-[#b7c0b6]">
              Get new recipes and cooking tips straight to your inbox.
            </p>
            <form
              className="flex overflow-hidden rounded-full border border-white/15 bg-white/[0.08]"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 bg-transparent px-4 py-3 text-[13px] text-white placeholder:text-[#9aa39a] outline-none min-w-0"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex w-[44px] items-center justify-center bg-terracotta hover:bg-terracotta-dark transition-colors flex-shrink-0"
              >
                <SendIcon className="h-4 w-4" />
              </button>
            </form>

            {/* Contact — only on desktop */}
            <div className="mt-5 hidden lg:flex items-center gap-2 text-[13px] text-[#b7c0b6]">
              <MailIcon className="h-[14px] w-[14px] flex-shrink-0 stroke-gold-light" />
              dallaherick0@gmail.com
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-5 text-center text-[12.5px] text-[#9aa39a] sm:flex-row sm:text-left">
          <span>© 2026 Flavor Find. All Rights Reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            <Link href="https://dallah.co.ke" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">dallah.co.ke</Link>

          </div>
        </div>

      </div>
    </footer>
  );
}
