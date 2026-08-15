import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

const LAST_UPDATED = 'August 15, 2024'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-b from-green-deep to-green-deeper px-6 py-14 text-center">
        <div className="mx-auto max-w-[640px]">
          <div className="eyebrow justify-center !text-gold-light mb-4">Legal</div>
          <h1 className="font-display text-[36px] text-white md:text-[48px]">Privacy Policy</h1>
          <p className="mt-3 text-[13px] text-white/50">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[800px] px-6 py-14 md:px-8">

        {/* Quick nav */}
        <div className="mb-10 rounded-lg2 bg-white p-6 shadow-[0_4px_16px_-6px_rgba(18,51,38,0.12)]">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-ink-soft">On This Page</p>
          <ul className="flex flex-col gap-2">
            {[
              ['#info-collect',   'Information We Collect'],
              ['#info-use',       'How We Use Your Information'],
              ['#cookies',        'Cookies & Tracking'],
              ['#third-party',    'Third-Party Services'],
              ['#data-security',  'Data Security'],
              ['#children',       'Children\'s Privacy'],
              ['#your-rights',    'Your Rights'],
              ['#changes',        'Changes to This Policy'],
              ['#contact',        'Contact Us'],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-[13.5px] text-terracotta hover:underline">{label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="prose-legal">

          <p className="mb-8 text-[14.5px] leading-[1.8] text-ink-soft">
            Welcome to FlavorFind (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). We are committed to protecting your
            personal information and your right to privacy. This Privacy Policy explains how we collect,
            use, and share information when you use our website at{' '}
            <strong className="text-ink">flavorfind.app</strong>.
          </p>

          <Section id="info-collect" title="1. Information We Collect">
            <p>We collect minimal information to provide our service:</p>
            <ul>
              <li><strong>Usage Data:</strong> Anonymous data about pages visited, search queries entered, and features used. This is collected automatically via standard web server logs.</li>
              <li><strong>Search Queries:</strong> The ingredients and search terms you type are processed to return recipe results. We do not store these queries linked to any personal identifier.</li>
              <li><strong>Contact Form Data:</strong> If you contact us via our contact form or email, we collect your name, email address, and the content of your message.</li>
              <li><strong>Newsletter Subscriptions:</strong> If you subscribe to our newsletter, we collect your email address.</li>
            </ul>
            <p>We do <strong>not</strong> require account registration and do <strong>not</strong> collect passwords, payment information, or sensitive personal data.</p>
          </Section>

          <Section id="info-use" title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and improve the FlavorFind recipe search service</li>
              <li>Respond to your messages and support requests</li>
              <li>Send newsletters (only if you opted in, and you can unsubscribe at any time)</li>
              <li>Analyse anonymous usage patterns to improve performance and user experience</li>
              <li>Detect and prevent abuse or technical issues</li>
            </ul>
            <p>We do <strong>not</strong> sell your personal data to third parties.</p>
          </Section>

          <Section id="cookies" title="3. Cookies & Tracking">
            <p>FlavorFind uses a small number of cookies and similar technologies:</p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for the website to function (e.g., session state, preferences). You cannot opt out of these.</li>
              <li><strong>Analytics Cookies:</strong> Anonymous, aggregated data to understand how visitors use the site (e.g., most-viewed pages, search patterns). No personally identifiable information is collected.</li>
            </ul>
            <p>You can control cookies through your browser settings. Disabling cookies may affect some functionality of the site.</p>
          </Section>

          <Section id="third-party" title="4. Third-Party Services">
            <p>We use the following third-party services that may process data on our behalf:</p>
            <ul>
              <li><strong>Spoonacular API:</strong> Our recipe data is sourced from Spoonacular. Search queries are sent to their servers to return results. See <a href="https://spoonacular.com/food-api/docs#Privacy" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">Spoonacular&rsquo;s Privacy Policy</a>.</li>
              <li><strong>Hosting Provider:</strong> Our website is hosted on a third-party server. Server logs may include your IP address for security and debugging purposes.</li>
              <li><strong>Analytics:</strong> We may use privacy-respecting analytics tools that do not share data with advertisers.</li>
            </ul>
            <p>We do not use advertising networks, social media trackers, or any third-party ad technology.</p>
          </Section>

          <Section id="data-security" title="5. Data Security">
            <p>
              We implement industry-standard security measures including HTTPS encryption for all data
              in transit. However, no method of transmission over the internet is 100% secure.
              We encourage you to use strong, unique passwords for your email account and to report
              any suspected security issues to us at{' '}
              <a href="mailto:dallaherick0@gmail.com" className="text-terracotta hover:underline">dallaherick0@gmail.com</a>.
            </p>
          </Section>

          <Section id="children" title="6. Children's Privacy">
            <p>
              FlavorFind is not directed at children under the age of 13. We do not knowingly collect
              personal information from children under 13. If you believe a child has provided us with
              personal information, please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section id="your-rights" title="7. Your Rights">
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data.</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing emails at any time using the unsubscribe link in any email.</li>
              <li><strong>Data Portability:</strong> Request your data in a machine-readable format.</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:dallaherick0@gmail.com" className="text-terracotta hover:underline">dallaherick0@gmail.com</a>.</p>
          </Section>

          <Section id="changes" title="8. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by updating the &ldquo;Last updated&rdquo; date at the top of this page. Continued use
              of FlavorFind after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section id="contact" title="9. Contact Us">
            <p>If you have questions or concerns about this Privacy Policy:</p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:dallaherick0@gmail.com" className="text-terracotta hover:underline">dallaherick0@gmail.com</a></li>
              <li><strong>WhatsApp:</strong> <a href="https://wa.me/254796605409" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">+254 796 605 409</a></li>
            </ul>
          </Section>

        </div>

        {/* Related links */}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/terms" className="rounded-full border border-green-deep/20 px-5 py-2 text-[13px] font-medium text-green-deep hover:bg-green-deep hover:text-white transition-colors">
            Terms of Use →
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
