import styles from './HowToBook.module.css'

const STEPS = [
  { n: '①', text: 'Choose your preferred date from upcoming dates' },
  { n: '②', text: 'Send an inquiry or book directly online' },
  { n: '③', text: 'Personal consultation with our team' },
  { n: '④', text: 'Pay deposit to secure your spot' },
] as const

export function HowToBook() {
  return (
    <section className={styles.section}>
      <h2>How to Book</h2>
      <ol className={styles.grid}>
        {STEPS.map((s, i) => (
          <li key={i} className={styles.step}>
            <span className={styles.num}>{s.n}</span>
            <span>{s.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
