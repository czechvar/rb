import styles from './Card.module.css'

export function Card({
  variant = 'default',
  children,
}: {
  variant?: 'default' | 'highlighted'
  children: React.ReactNode
}) {
  return (
    <div className={`${styles.card} ${variant === 'highlighted' ? styles.highlighted : ''}`}>
      {children}
    </div>
  )
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>
}
