import Link from 'next/link'
import styles from './marketing.module.css'

export function Header() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.brand}>ROCKBUSTERS</Link>
      <div className={styles.navLinks}>
        <Link href="/calendar">Calendar</Link>
        <Link href="/destinations">Destinations</Link>
        <Link href="/team">Team</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/contact">Contact</Link>
      </div>
    </nav>
  )
}
