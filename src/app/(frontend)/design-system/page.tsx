import styles from './page.module.css'
import { ThemeWorkbench } from './ThemeWorkbench'

type DesignSystemPageProps = {
  searchParams: Promise<{ theme?: string }>
}

const swatches = [
  ['Page', '--theme-color-page-bg', 'page'],
  ['Canvas', '--theme-color-canvas', 'dark'],
  ['Surface 1', '--theme-color-surface-1', 'dark'],
  ['Primary', '--theme-color-primary', 'primary'],
  ['Paper', '--theme-color-paper', 'paper'],
  ['White Paper', '--theme-color-white-paper', 'paper'],
  ['Text', '--theme-color-text', 'text'],
  ['Border', '--theme-color-border', 'border'],
] as const

const detailTokens = [
  ['--theme-color-detail-canvas', 'Deep background for dense program-detail sections.'],
  ['--theme-color-detail-surface', 'Panel surface inside detail sections.'],
  ['--theme-color-detail-action', 'Local action color for section-specific CTAs.'],
  ['--theme-color-detail-muted', 'Supporting rule, badge, and metadata color.'],
  ['--theme-color-detail-text', 'Primary text on the detail palette.'],
] as const

export const metadata = {
  title: 'Design System - Rockbusters',
}

export default async function DesignSystemPage({ searchParams }: DesignSystemPageProps) {
  const params = await searchParams
  const theme = params.theme === 'snowbusters' ? 'snowbusters' : 'rockbusters'
  const themeClass = theme === 'snowbusters' ? 'theme-snowbusters' : 'theme-rockbusters'
  const themeLabel = theme === 'snowbusters' ? 'Snowbusters' : 'Rockbusters'

  return (
    <ThemeWorkbench key={theme} theme={theme} themeClass={themeClass}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <strong>{themeLabel}</strong>
          <span>Local theme reference driven by src/app/(frontend)/theme.css</span>
        </div>
        <nav className={styles.themeSwitch} aria-label="Theme">
          <a
            className={theme === 'rockbusters' ? styles.active : undefined}
            href="/design-system?theme=rockbusters"
          >
            Rockbusters
          </a>
          <a
            className={theme === 'snowbusters' ? styles.active : undefined}
            href="/design-system?theme=snowbusters"
          >
            Snowbusters
          </a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>Theme contract</p>
            <h1>Shared Design System</h1>
            <p className={styles.heroCopy}>
              This page is a deployable specimen for the semantic CSS contract. It should change
              when local theme tokens change, because it renders inside the app theme layer.
            </p>
          </div>
          <aside className={styles.statPanel} aria-label="Theme token summary">
            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <strong>2</strong>
                <span>Brand skins</span>
              </div>
              <div className={styles.stat}>
                <strong>1</strong>
                <span>Token contract</span>
              </div>
              <div className={styles.stat}>
                <strong>0</strong>
                <span>Copied app CSS</span>
              </div>
            </div>
            <div className={styles.notice}>
              Components below intentionally consume semantic <code>--theme-*</code> tokens.
            </div>
          </aside>
        </div>
      </section>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Foundation</h2>
            <p>Core page, surface, brand, and text tokens used by public UI sections.</p>
          </div>
          <div className={styles.swatchGrid}>
            {swatches.map(([label, token, tone]) => (
              <div className={`${styles.swatch} ${styles[tone]}`} key={token}>
                <span>{label}</span>
                <code>{token}</code>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Type And Status</h2>
            <p>Typography, focus, and state colors need to stay legible across both skins.</p>
          </div>
          <div className={styles.coverageGrid}>
            <article className={styles.typeSpecimen}>
              <p className={styles.eyebrow}>Type scale</p>
              <h3>Heading sample</h3>
              <p>
                Body copy uses the semantic body font and page text color. Technical labels use the
                mono token for data-heavy surfaces.
              </p>
              <code>font-family: var(--theme-font-technical)</code>
            </article>
            <article className={styles.statusPanel}>
              <span className={styles.infoStatus}>Info</span>
              <span className={styles.successStatus}>Open</span>
              <span className={styles.warningStatus}>Limited</span>
              <span className={styles.dangerStatus}>Closed</span>
            </article>
            <article className={styles.layoutPanel}>
              <p className={styles.eyebrow}>Layout rhythm</p>
              <div className={styles.spacingTrack}>
                <span />
                <span />
                <span />
                <span />
              </div>
              <p>Spacing bars consume the semantic space scale and card padding tokens.</p>
            </article>
            <article className={styles.focusPanel}>
              <p className={styles.eyebrow}>Focus state</p>
              <button type="button">Focusable control</button>
              <p>The outline consumes the shared focus token used by keyboard navigation.</p>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Components</h2>
            <p>Representative buttons, cards, forms, badges, and trip merchandising surfaces.</p>
          </div>
          <div className={styles.componentGrid}>
            <article className={styles.darkCard}>
              <p className={styles.eyebrow}>Dark surface</p>
              <h3>Trip planning panel</h3>
              <p>
                Dark cards should retain readable text, restrained borders, and enough shadow to
                separate layered catalogue surfaces.
              </p>
              <div className={styles.buttonRow}>
                <a className={`${styles.button} ${styles.primaryButton}`} href="#">
                  Book now
                </a>
                <a className={`${styles.button} ${styles.secondaryButton}`} href="#">
                  View dates
                </a>
                <a className={`${styles.button} ${styles.ghostButton}`} href="#">
                  Details
                </a>
              </div>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>Featured</span>
                <span className={`${styles.badge} ${styles.mutedBadge}`}>Intermediate</span>
                <span className={`${styles.badge} ${styles.successBadge}`}>Open</span>
              </div>
            </article>

            <article className={styles.paperCard}>
              <p className={styles.eyebrow}>White paper</p>
              <h3>Checkout summary</h3>
              <p>
                Explicit white-paper tokens protect forms, breadcrumb bars, checkout panels, and
                table surfaces from being swallowed by dark site themes.
              </p>
              <div className={styles.paperNotice}>
                Deposit due today: EUR 290. Remaining balance is handled by the admin order flow.
              </div>
            </article>

            <article className={styles.detailCard}>
              <p className={styles.eyebrow}>Detail palette</p>
              <h3>Program detail module</h3>
              <p>
                Detail tokens are brand-specific accents for itinerary, curriculum, logistics, and
                final call-to-action sections.
              </p>
              <div className={styles.buttonRow}>
                <a className={`${styles.button} ${styles.detailButton}`} href="#">
                  Continue
                </a>
                <a className={`${styles.button} ${styles.detailOutlineButton}`} href="#">
                  Compare
                </a>
              </div>
            </article>

            <form className={styles.formCard}>
              <p className={styles.eyebrow}>Form surface</p>
              <h3>Account details</h3>
              <label>
                Full name
                <input defaultValue="Alex Sender" />
              </label>
              <label>
                Preferred trip
                <select defaultValue="Deep water solo camp">
                  <option>Deep water solo camp</option>
                  <option>Technique coaching week</option>
                </select>
              </label>
            </form>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Trip Card</h2>
            <p>
              Catalogue cards need to preserve image fade overlays, hierarchy, and CTA contrast.
            </p>
          </div>
          <article className={styles.tripCard}>
            <div className={styles.tripMedia}>
              <div>
                <p className={styles.eyebrow}>Mallorca</p>
                <h2>Deep Blue Psicobloc</h2>
              </div>
            </div>
            <div className={styles.tripBody}>
              <p>
                A mixed week of coaching, rest-day logistics, and guided climbing. The overlay
                gradient uses dark overlay tokens with the same alpha scale as production sections.
              </p>
              <div className={styles.tripMeta}>
                <span>7 days</span>
                <span>May to Oct</span>
                <span>From EUR 1,390</span>
              </div>
              <div className={styles.buttonRow}>
                <a className={`${styles.button} ${styles.primaryButton}`} href="#">
                  Reserve
                </a>
                <a className={`${styles.button} ${styles.ghostButton}`} href="#">
                  Explore trip
                </a>
              </div>
            </div>
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Detail Tokens</h2>
            <p>These values are intentionally separate per brand, not Snowbusters warm tokens.</p>
          </div>
          <table className={styles.tokenTable}>
            <thead>
              <tr>
                <th>Token</th>
                <th>Sample</th>
                <th>Intended role</th>
              </tr>
            </thead>
            <tbody>
              {detailTokens.map(([token, role]) => (
                <tr key={token}>
                  <td>
                    <code>{token}</code>
                  </td>
                  <td>
                    <div
                      className={styles.miniSwatch}
                      style={{ ['--sample' as string]: `var(${token})` }}
                    />
                  </td>
                  <td>{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </ThemeWorkbench>
  )
}
