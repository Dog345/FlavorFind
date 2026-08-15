import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

const LAST_UPDATED = 'August 15, 2024'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-b from-green-deep to-green-deeper px-6 py-14 text-center">
        <div className="mx-auto max-w-[640px]">
          <div className="eyebrow justify-center !text-gold-light mb-4">Legal</div>
          <h1 className="font-display text-[36px] text-white md:text-[48px]">Terms of Use</h1>
          <p className="mt-3 text-[13px] text-white/50">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-6 py-14 md:px-8">

        {/* Quick nav */}
        <div className="mb-10 rounded-lg2 bg-white p-6 shadow-[0_4px_16px_-6px_rgba(18,51,38,0.12)]">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-ink-soft">On This Page</p>
          <ul className="flex flex-col gap-2">
            {[
              ['#acceptance',      'Acceptance of Terms'],
              ['#use-of-service',  'Use of Service'],
              ['#content',         'Content & Intellectual Property'],
              ['#recipes',         'Recipe Content Disclaimer'],
              ['#prohibited',      'Prohibited Conduct'],
              ['#disclaimers',     'Disclaimers'],
              ['#limitation',      'Limitation of Liability'],
              ['#indemnification', 'Indemnification'],
              ['#changes',         'Changes to Terms'],
              ['#governing-law',   'Governing Law'],
              ['#contact',         'Contact Us'],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-[13.5px] text-terracotta hover:underline">{label}</a>
              </li>
            ))}
          </ul>
        </div>

        <p className="mb-8 text-[14.5px] leading-[1.8] text-ink-soft">
          Please read these Terms of Use (&ldquo;Terms&rdquo;) carefully before using FlavorFind
          (&ldquo;the Service&rdquo;). By accessing or using FlavorFind, you agree to be bound by these Terms.
          If you do not agree, please do not use the Service.
        </p>

        <Section id="acceptance" title="1. Acceptance of Terms">
          <p>
            By accessing and using FlavorFind, you confirm that you are at least 13 years of age,
            have read and understood these Terms, and agree to be bound by them. If you are using
            the Service on behalf of an organisation, you represent that you have authority to bind
            that organisation to these Terms.
          </p>
        </Section>

        <Section id="use-of-service" title="2. Use of Service">
          <p>FlavorFind is a free recipe discovery platform. You may use the Service to:</p>
          <ul>
            <li>Search for recipes by ingredient</li>
            <li>Browse recipe categories</li>
            <li>View recipe details, ingredients, and instructions</li>
            <li>Share recipes via the share functionality provided</li>
          </ul>
          <p>
            We grant you a limited, non-exclusive, non-transferable, revocable licence to access
            and use the Service for personal, non-commercial purposes.
          </p>
        </Section>

        <Section id="content" title="3. Content & Intellectual Property">
          <p>
            All content on FlavorFind — including text, graphics, logos, icons, and software — is
            the property of FlavorFind or its content suppliers and is protected by applicable
            intellectual property laws.
          </p>
          <p>
            Recipe data is sourced from Spoonacular and other licensed providers. Their respective
            terms and attributions apply to that content.
          </p>
          <p>
            You may not reproduce, distribute, modify, create derivative works of, publicly display,
            or commercially exploit any content from FlavorFind without our express written permission.
          </p>
        </Section>

        <Section id="recipes" title="4. Recipe Content Disclaimer">
          <p>
            Recipes and nutritional information on FlavorFind are provided for informational purposes
            only. We make no warranties regarding the accuracy, completeness, or suitability of any
            recipe for your specific dietary needs, allergies, or health conditions.
          </p>
          <p>
            Always check ingredient labels for allergen information. If you have a medical condition
            or dietary restriction, consult a qualified healthcare professional before following
            any recipe.
          </p>
        </Section>

        <Section id="prohibited" title="5. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
            <li>Scrape, crawl, or harvest data from the Service without express written permission</li>
            <li>Attempt to gain unauthorised access to any part of the Service or its servers</li>
            <li>Transmit any harmful, offensive, or disruptive content through the Service</li>
            <li>Misrepresent your identity or affiliation with any person or entity</li>
            <li>Use the Service in a way that could damage, disable, or impair the Service</li>
            <li>Circumvent any security or access-control features of the Service</li>
          </ul>
        </Section>

        <Section id="disclaimers" title="6. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
            EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
          <p>
            We do not warrant that the Service will be uninterrupted, error-free, or free of viruses
            or other harmful components. We reserve the right to modify, suspend, or discontinue
            the Service at any time without notice.
          </p>
        </Section>

        <Section id="limitation" title="7. Limitation of Liability">
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, FLAVORFIND SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR
            USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE
            POSSIBILITY OF SUCH DAMAGES.
          </p>
          <p>
            Our total liability to you for any claims arising from use of the Service shall not
            exceed the amount you paid us in the 12 months preceding the claim (which, since the
            Service is free, will be zero).
          </p>
        </Section>

        <Section id="indemnification" title="8. Indemnification">
          <p>
            You agree to indemnify, defend, and hold harmless FlavorFind, its officers, directors,
            employees, and agents from and against any claims, liabilities, damages, losses, and
            expenses (including legal fees) arising from your use of the Service or violation of
            these Terms.
          </p>
        </Section>

        <Section id="changes" title="9. Changes to Terms">
          <p>
            We reserve the right to update these Terms at any time. We will notify users of
            material changes by updating the &ldquo;Last updated&rdquo; date. Your continued use of the
            Service after changes constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section id="governing-law" title="10. Governing Law">
          <p>
            These Terms are governed by and construed in accordance with the laws of Kenya.
            Any disputes arising from these Terms or your use of the Service shall be subject
            to the exclusive jurisdiction of the courts of Kenya.
          </p>
        </Section>

        <Section id="contact" title="11. Contact Us">
          <p>If you have questions about these Terms:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:dallaherick0@gmail.com" className="text-terracotta hover:underline">dallaherick0@gmail.com</a></li>
            <li><strong>WhatsApp:</strong> <a href="https://wa.me/254796605409" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">+254 796 605 409</a></li>
          </ul>
        </Section>

        {/* Related links */}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/privacy" className="rounded-full border border-green-deep/20 px-5 py-2 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors">
            Privacy Policy →
          </Link>
          <Link href="/faq" className="rounded-full border border-green-deep/20 px-5 py-2 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors">
            FAQ →
          </Link>
          <Link href="/contact" className="rounded-full border border-green-deep/20 px-5 py-2 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors">
            Contact Us →
          </Link>
        </div>

      </div>

      <Footer />
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="mb-4 font-display text-[20px] text-green-deep border-b border-cream-2 pb-2">{title}</h2>
      <div className="flex flex-col gap-3 text-[14px] leading-[1.8] text-ink-soft [&_ul]:ml-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:list-disc [&_strong]:text-ink [&_a]:text-terracotta">
        {children}
      </div>
    </section>
  )
}
