import styles from './marketing.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>ROCKBUSTERS.NET</span>
      <span>© {new Date().getFullYear()}</span>
    </footer>
  )
}
