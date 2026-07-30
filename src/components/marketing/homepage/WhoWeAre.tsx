import styles from './WhoWeAre.module.css'

const PILLARS = [
  {
    num: '01',
    title: 'Maximum climbing time',
    body: 'From dawn to dusk. Every day. No dead time, no filler excursions. Just rock, movement, and genuine progress.',
  },
  {
    num: '02',
    title: 'Technical & mental coaching',
    body: 'Individual video analysis, route reading, footwork, head game — coaching that actually moves the needle.',
  },
  {
    num: '03',
    title: 'World-class coaches',
    body: 'We work alongside some of the strongest climbers alive. Their knowledge is embedded in everything we do.',
  },
  {
    num: '04',
    title: 'Ground logistics sorted',
    body: 'Accommodation, guiding, coaching, equipment, beta, and local knowledge included. We connect you with others to share rental cars and handle the whole process — you just focus on climbing.',
  },
  {
    num: '05',
    title: 'Insider area knowledge',
    body: 'Secret crags, perfect projecting routes, local beta, local community. You get the real picture, not the tourist route.',
  },
  {
    num: '06',
    title: 'Climbing is our lifestyle',
    body: 'We present climbing as it truly is — a culture, an obsession, a way of being. Come live it with us.',
  },
]

export function WhoWeAre() {
  return (
    <section className={styles.section} id="about">
      <div className={styles.intro}>
        <div className="reveal">
          <p className="section-label">Who we are</p>
          <h2 className="section-title">
            NOT A TOUR COMPANY.
            <br />A CLIMBING COMMUNITY.
          </h2>
        </div>
        <div className="reveal">
          <p className={styles.body}>
            Rockbusters is a community of guides, coaches, and passionate climbers who have made
            rock climbing our entire life. We don&apos;t guide on the side — this is <em>it</em>{' '}
            for us.
          </p>
          <p className={styles.body}>
            Every trip and course we run is built around one thing: maximum quality and quantity of
            climbing. Technical mastery, mental game, movement efficiency — we coach it all, on the
            same crags where the world&apos;s best do their hardest routes.
          </p>
        </div>
      </div>

      <div className={styles.pillarsGrid}>
        {PILLARS.map((p) => (
          <div key={p.num} className={`${styles.pillar} reveal`}>
            <div className={styles.pillarNum}>{p.num}</div>
            <h3 className={styles.pillarTitle}>{p.title}</h3>
            <p className={styles.pillarBody}>{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
