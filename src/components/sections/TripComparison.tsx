import type { ReactNode } from 'react'
import type { Event } from '@/payload-types'
import { SectionIntro } from './SectionIntro'
import styles from './TripComparison.module.css'

/** Empty editorial fields never manufacture a comparison or reserve blank space. */
export function TripProgrammeComparison({ programme, comparison }: {
  programme: ReactNode
  comparison?: Event['comparison']
}) {
  if (!comparison?.heading || !comparison.leftHeading || !comparison.rightHeading || !comparison.rows?.length) return programme
  return <div className={`${styles.split} ${!programme ? styles.single : ''}`}>
    {programme && <div className={styles.programme}>{programme}</div>}
    <section className={styles.comparison}>
      <SectionIntro variant="embedded" eyebrow="What's Different" title={comparison.heading} lead={comparison.intro ?? undefined} align="left" />
      <div className={styles.scroll} role="region" aria-label={comparison.heading} tabIndex={0}>
        <table>
          <caption className={styles.caption}>{comparison.heading}</caption>
          <thead><tr><th scope="col">Feature</th><th scope="col">{comparison.leftHeading}</th><th scope="col">{comparison.rightHeading}</th></tr></thead>
          <tbody>{comparison.rows.map((row, index) => <tr key={row.id ?? index}><th scope="row">{row.label}</th><td>{row.left}</td><td>{row.right}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  </div>
}
