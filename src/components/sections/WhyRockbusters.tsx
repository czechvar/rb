import styles from './WhyRockbusters.module.css'
import { SectionIntro } from './SectionIntro'

const DIFFERENTIATORS = [
  'Small groups for individual coaching attention',
  'Elite coaches with high-grade ascent backgrounds',
  'Focus on measurable skill development',
  'Video analysis and personalised plans',
  'Hand-picked destinations chosen for coaching quality',
] as const

export function WhyRockbusters() {
  return (
    <section className={styles.band}>
      <SectionIntro title="Why Rockbusters" />
      <div className={styles.grid}>
        <p>
          Rockbusters is Europe&apos;s leading climbing performance community —
          built by climbers who believe the best way to help others improve is to
          have done it themselves at the highest level.
        </p>
        <ul>
          {DIFFERENTIATORS.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
