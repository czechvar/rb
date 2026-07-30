import styles from './ValuePillars.module.css'

const PILLARS: { title: string; body: string }[] = [
  {
    title: 'Elite athletes as your actual guide',
    body: "Our coaches have redpointed 9a+, competed at World Cups, and put up first ascents. They're not instructors — they're active elite climbers sharing real knowledge.",
  },
  {
    title: 'UIAGM safety on every trip',
    body: 'Every guided trip operates under UIAGM-certified leadership. International safety standards, professional risk management, and deep local knowledge on every route.',
  },
  {
    title: 'Small groups, real progress',
    body: 'We cap groups to give you genuine attention. Your coach will know your movement style by day two — specific feedback that actually changes how you climb.',
  },
  {
    title: 'Insider crag knowledge',
    body: "From Siurana to Kalymnos to Font — our guides know the secret lines, ideal conditions, and local spots that don't appear on any app.",
  },
  {
    title: 'Tailored to your level',
    body: "Whether you're projecting 8a or just leading outdoors for the first time, we match you with the right guide, trip, and goals for exactly where you are.",
  },
  {
    title: 'Community, not just a course',
    body: 'Guests who climb with Rockbusters come back. The friendships, shared projects, and WhatsApp groups — built on real shared experience at the crag.',
  },
]

export function ValuePillars() {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {PILLARS.map((p, i) => (
          <div key={p.title} className={`${styles.pillar} reveal`}>
            <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
            <h3 className={styles.title}>{p.title}</h3>
            <p className={styles.body}>{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
