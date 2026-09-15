import Image from 'next/image'
import Link from 'next/link'
import styles from './marketing.module.css'
import { NewsletterForm } from './NewsletterForm'

const TRIPS = [
  { href: '/trips?category=expeditions', label: 'Climbing Road Trips & Expeditions' },
  { href: '/trips?category=sport-climbing-holidays', label: 'Sport Climbing Holidays' },
  { href: '/trips?category=bouldering-camps', label: 'Bouldering Camps' },
  { href: '/trips?category=custom-trips', label: 'Custom Trips' },
]

const COACHING = [
  { href: '/trips?category=performance-technique-camps', label: 'Performance & Technique Camps' },
  { href: '/trips?category=sport-climbing-courses', label: 'Sport Climbing Courses' },
  { href: '/trips?category=trad-multipitch', label: 'Trad & Multi-Pitch' },
  { href: '/trips?category=private-coaching', label: 'Private Coaching' },
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
              </p>
              <NewsletterForm />
            </div>

            <div className={styles.footerCol}>
              <h4 data-type="label">Trips</h4>
              <ul>
                {TRIPS.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4 data-type="label">Coaching</h4>
              <ul>
                {COACHING.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4 data-type="label">Company</h4>
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
              <Link href="/terms-and-conditions" className={styles.footerTermsLink}>
                Terms &amp; Conditions
              </Link>
            </small>
            <span className={styles.footerTagline}>
              CLIMB. HARD.<br />
              EAT. SLEEP.<br />
              CLIMB. AGAIN.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
