import type { TripEditorial } from '@/lib/trip-editorial'
import { normalizeActionHref } from '@/lib/safe-url'
import type { ReactNode } from 'react'
import type { Event } from '@/payload-types'
import { SectionIntro } from './SectionIntro'
import styles from './TripComparison.module.css'

/** Empty editorial fields never manufacture a comparison or reserve blank space. */
export function TripProgrammeComparison({
  programme,
  comparison,
  heading,
  eyebrow = "What's Different",
  intro,
  companion,
  text = (value) => value ?? undefined,
}: {
  programme: ReactNode
  comparison?: Event['comparison']
  companion?: TripEditorial['companion']
  text?: (value: string | null | undefined) => string | undefined
  heading?: ReactNode
  eyebrow?: string
  intro?: string
}) {
  const columns = companion?.columns ?? []
  const rows = companion?.rows?.filter((row) => row.cells?.some((cell) => cell.text)) ?? []
  const links = companion?.links?.filter((link) => link.label || link.description) ?? []
  if ((columns.length && rows.length) || links.length)
    return (
      <div className={`${styles.split} ${!programme ? styles.single : ''}`}>
        {programme && <div className={styles.programme}>{programme}</div>}
        <section className={styles.comparison}>
          <SectionIntro
            variant="embedded"
            eyebrow={eyebrow}
            title={heading}
            lead={intro}
            align="left"
          />
          {!!rows.length && !!columns.length && (
            <div
              className={styles.scroll}
              tabIndex={0}
              role="region"
              aria-label="Programme comparison"
            >
              <table>
                <thead>
                  <tr>
                    {columns.map((column, index) => (
                      <th scope="col" key={index}>
                        {text(column.label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      {columns.map((_, cellIndex) =>
                        cellIndex === 0 ? (
                          <th scope="row" key={cellIndex}>
                            {text(row.cells?.[cellIndex]?.text)}
                          </th>
                        ) : (
                          <td key={cellIndex}>{text(row.cells?.[cellIndex]?.text)}</td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!!links.length && (
            <ul>
              {links.map((link, index) => {
                const href = normalizeActionHref(link.href)
                return (
                  <li key={index}>
                    {href ? (
                      <a href={href}>{text(link.label)}</a>
                    ) : (
                      <strong>{text(link.label)}</strong>
                    )}
                    {link.description && <p>{text(link.description)}</p>}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    )
  if (
    !comparison?.leftHeading ||
    !comparison.rightHeading ||
    !comparison.rows?.length
  )
    return programme
  return (
    <div className={`${styles.split} ${!programme ? styles.single : ''}`}>
      {programme && <div className={styles.programme}>{programme}</div>}
      <section className={styles.comparison}>
        <SectionIntro
          variant="embedded"
          eyebrow={eyebrow}
          title={heading ?? comparison.heading}
          lead={intro ?? comparison.intro ?? undefined}
          align="left"
        />
        <div className={styles.scroll} role="region" aria-label={comparison.heading || 'Programme comparison'} tabIndex={0}>
          <table>
            <caption className={styles.caption}>{comparison.heading || 'Programme comparison'}</caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">{comparison.leftHeading}</th>
                <th scope="col">{comparison.rightHeading}</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row, index) => (
                <tr key={row.id ?? index}>
                  <th scope="row">{row.label}</th>
                  <td>{row.left}</td>
                  <td>{row.right}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
