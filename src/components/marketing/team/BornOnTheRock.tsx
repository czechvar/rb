import styles from './BornOnTheRock.module.css'

export function BornOnTheRock() {
  return (
    <section className={styles.section} id="about">
      <div className={styles.grid}>
        <div>
          <p className="section-label">Our Story</p>
          <h2 className="section-title">
            Born on
            <br />
            the rock
          </h2>
        </div>
        <div className={styles.body}>
          <p>
            Rockbusters was born from a simple conviction: the best teachers are the ones still
            climbing hard. Founded by Jany — a climber, adventurer, and relentless connector of
            people — the community grew organically from cramped belays and shared rope bags into
            something the climbing world had never quite seen before.
          </p>
          <p>
            Jany&apos;s vision wasn&apos;t a climbing school. It was a living ecosystem — bringing
            together elite athletes who perform at the highest level with guests who want the real
            thing. No corporate packages. Just genuine progression in beautiful places with people
            who have dedicated their lives to the vertical world.
          </p>
          <div className={styles.quoteBlock}>
            <span className={styles.founderName}>Jany</span>
            <span className={styles.founderRole}>Founder, Rockbusters</span>
            <blockquote className={styles.quote}>
              &ldquo;The best route is the one that changes how you see yourself. We don&apos;t just
              guide people up rock — we help them discover what they&apos;re actually capable of.
              That&apos;s been the whole point, from day one.&rdquo;
            </blockquote>
            <span className={styles.attr}>— Jany, on why Rockbusters exists</span>
          </div>
        </div>
      </div>
    </section>
  )
}
