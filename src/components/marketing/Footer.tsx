import Image from 'next/image'
import Link from 'next/link'
import styles from './marketing.module.css'
import { NewsletterForm } from './NewsletterForm'

const TRIPS = [
  { href: '#', label: 'Road Trips' },
  { href: '#', label: 'Sport Holidays' },
  { href: '#', label: 'Bouldering Camps' },
  { href: '#', label: 'Custom Trips' },
]

const COACHING = [
  { href: '#', label: 'Performance Camps' },
  { href: '#', label: 'Private Coaching' },
  { href: '#', label: 'Pro Clinics' },
  { href: '#', label: 'Video Analysis' },
]

const COMPANY = [
  { href: '/team', label: 'Meet the Team' },
  { href: '/destinations', label: 'Destinations' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact Us' },
]

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerLinks}>
        <div className={styles.footerLinksInner}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <Image
                src="/logo-rockbusters.png"
                alt="Rockbusters"
                width={240}
                height={48}
              />
              <p>
                A community of climbing coaches and guides dedicated to maximum
                progression on real rock across Europe&apos;s greatest crags.
                Climb harder. Climb smarter.
              </p>
              <NewsletterForm />
            </div>

            <div className={styles.footerCol}>
              <h4>Trips</h4>
              <ul>
                {TRIPS.map((l) => (
                  <li key={l.label}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4>Coaching</h4>
              <ul>
                {COACHING.map((l) => (
                  <li key={l.label}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4>Company</h4>
              <ul>
                {COMPANY.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <small className={styles.footerCopy}>
              © {new Date().getFullYear()} Rockbusters. All rights reserved.
              Proud member of 1% For The Planet.{' '}
              <span aria-hidden="true">·</span>{' '}
              <Link href="/terms" className={styles.footerTermsLink}>
                Terms &amp; Conditions
              </Link>
            </small>
            <span className={styles.footerTagline}>
              Climb harder. Climb smarter.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
