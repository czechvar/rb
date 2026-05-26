import Image from 'next/image'
import Link from 'next/link'
import styles from './marketing.module.css'

const SERVICES = [
  { href: '/programs/climbing-camps', label: 'Climbing Camps' },
  { href: '/programs/technique-coaching', label: 'Technique Coaching' },
  { href: '/programs/private-guiding', label: 'Private Guiding' },
  { href: '/programs/expeditions', label: 'Expeditions' },
]

const DESTINATIONS = [
  { href: '/destinations/spain', label: 'Spain' },
  { href: '/destinations/italy', label: 'Italy' },
  { href: '/destinations/france', label: 'France' },
  { href: '/destinations/czechia', label: 'Czechia' },
]

const ABOUT = [
  { href: '/about', label: 'About Us' },
  { href: '/team', label: 'Rockbusters Team' },
  { href: '/partners', label: 'Partners' },
]

const CONTACT = [
  { href: 'mailto:info@rockbusters.net', label: 'info@rockbusters.net' },
  { href: 'tel:00420776805045', label: '+420 776 805 045' },
  { href: '/faq', label: 'FAQ' },
  { href: '/terms', label: 'Terms & Conditions' },
]

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContactSection}>
        <div className={styles.footerContactGrid}>
          <div className={styles.footerContactText}>
            <span className={styles.footerEyebrow}>Contact Us</span>
            <h2>Ready to Send Your Project?</h2>
            <div className={styles.divider} />
            <p>Tell us your goals, dates, and grade — we&apos;ll come back with a plan.</p>
          </div>
          <div className={styles.footerContactForm}>
            <div className={styles.footerContactFormPlaceholder}>
              Contact form lands here in the next round.
              <br />
              <br />
              For now: <a href="mailto:info@rockbusters.net">info@rockbusters.net</a>
            </div>
          </div>
        </div>
      </div>

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
              <ul>
                {ABOUT.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4>Services</h4>
              <ul>
                {SERVICES.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4>Destinations</h4>
              <ul>
                {DESTINATIONS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4>Contact</h4>
              <ul>
                {CONTACT.map((l) => (
                  <li key={l.href}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <small>
              © {new Date().getFullYear()} Rockbusters. All rights reserved. Proud member of 1% For The Planet.
            </small>
          </div>
        </div>
      </div>
    </footer>
  )
}
