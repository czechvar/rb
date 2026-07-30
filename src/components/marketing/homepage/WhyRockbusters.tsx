import styles from './WhyRockbusters.module.css'

const CARDS = [
  {
    tag: 'The progress problem',
    heading: "Can't find time to improve? Can't stay disciplined?",
    body: 'Total immersion fixes both. Intensive coaching, professional guides by your side all day, every day. Plateaus get smashed.',
  },
  {
    tag: 'The technique gap',
    heading: 'Want real coaching, not just guided mileage?',
    body: 'Video analysis, one-on-one instruction, individual feedback. We coach movement, not just route lists.',
  },
  {
    tag: 'The habit question',
    heading: 'Want to build habits that stick after the trip?',
    body: 'We teach you how to train, how to read routes, how to think like a climber. The gains come home with you.',
  },
  {
    tag: 'The logistics fear',
    heading: 'Seems like a big decision? It really isn’t.',
    body: 'Buy your flights. We help with all ground logistics — accommodation, guiding, coaching, equipment, local knowledge, and we connect you with fellow climbers to share rental cars. Simple.',
  },
  {
    tag: 'The solo traveller',
    heading: 'Coming alone? We match you with your climbing tribe.',
    body: 'Our buddy system pairs solo climbers. You arrive alone, you leave with partners for life. Happens every trip.',
  },
  {
    tag: 'The beta advantage',
    heading: 'Want the routes no guidebook will ever show you?',
    body: 'We know these crags obsessively. The hidden sectors, perfect-grade routes, the locals-only classics. That’s your experience.',
  },
]

export function WhyRockbusters() {
  return (
    <section className={styles.section} id="why">
      <p className="section-label">Why Rockbusters</p>
      <h2 className="section-title">
        EVERY QUESTION
        <br />
        YOU&apos;RE PROBABLY ASKING
      </h2>
      <div className={styles.grid}>
        {CARDS.map((c) => (
          <div key={c.heading} className={`${styles.card} reveal`}>
            <p className={styles.cardTag}>{c.tag}</p>
            <h3 className={styles.cardHeading}>{c.heading}</h3>
            <p className={styles.cardBody}>{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
