import type { Event, EventDate, Guide, Location, Post, Program } from '@/payload-types'
import {
  BlockHeader,
  EventDateCard,
  GuideCard,
  LocationCard,
  PostCard,
  ProgramCard,
  TripCard as CatalogueTripCard,
  featuredCardClassName,
} from '@/components/blocks/CatalogueCards'
import { FormBanner } from '@/components/forms/FormBanner'
import { FormField } from '@/components/forms/FormField'
import { Card, CardGrid } from '@/components/sections/Card'
import { PricingSidebar } from '@/components/sections/PricingSidebar'
import { SectionIntro } from '@/components/sections/SectionIntro'
import { TagChipStrip } from '@/components/sections/TagChipStrip'
import { themeTokenGroups, themeTokens, type ThemeToken } from '@/lib/theme/tokenRegistry'
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

const sampleLocation = {
  id: 1,
  name: 'Kalymnos',
  slug: 'kalymnos',
  city: 'Masouri',
  country: 'Greece',
} as unknown as Location

const sampleProgram = {
  id: 1,
  name: 'Performance Coaching',
  slug: 'performance-coaching',
  shortDescription:
    'Technique, tactics, and movement coaching for climbers building a durable base.',
} as unknown as Program

const sampleGuide = {
  id: 1,
  name: 'Jany',
  slug: 'jany',
  role: 'Head guide',
  tagline: 'Precise coaching for steep limestone and long days outside.',
} as unknown as Guide

const samplePost = {
  id: 1,
  title: 'How to prepare for a climbing week',
  slug: 'prepare-climbing-week',
  excerpt: 'A practical checklist for training, packing, and arriving ready to climb.',
  publishedAt: '2026-09-16T08:00:00.000Z',
} as unknown as Post

const sampleEvent = {
  id: 1,
  title: 'Deep Blue Psicobloc',
  slug: 'deep-blue-psicobloc',
  shortDescription: 'A mixed week of coaching, rest-day logistics, and guided climbing by the sea.',
  locations: [sampleLocation],
} as unknown as Event

const sampleEventDate = {
  id: 1,
  event: sampleEvent,
  dateFrom: '2026-10-12T00:00:00.000Z',
  dateTo: '2026-10-19T00:00:00.000Z',
  currency: 'EUR',
  price: 1390,
  capacity: 8,
} as unknown as EventDate

function tokenSampleClass(token: ThemeToken) {
  if (token.kind === 'color') return styles.tokenSampleColor
  if (token.kind === 'shadow') return styles.tokenSampleShadow
  if (token.kind === 'space' || token.kind === 'size') return styles.tokenSampleMeasure
  if (token.kind === 'motion') return styles.tokenSampleMotion
  if (token.kind === 'font') return styles.tokenSampleFont
  return styles.tokenSampleRaw
}

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
            <h2>Repo Components</h2>
            <p>
              Existing presentational components rendered with fixture data so theme edits hit real
              app surfaces.
            </p>
          </div>
          <div className={styles.repoComponentStack}>
            <div className={styles.repoBand}>
              <SectionIntro
                eyebrow="SectionIntro"
                title="Real Section Rhythm"
                lead="This is the shared section intro used by trip and program detail blocks."
              />
            </div>

            <div className={styles.repoBand}>
              <CardGrid>
                <Card>
                  <span className={styles.cardKicker}>Default Card</span>
                  <p>Reusable detail cards inherit paper, ink, border, and primary accents.</p>
                </Card>
                <Card variant="highlighted">
                  <span className={styles.cardKicker}>Highlighted Card</span>
                  <p>The highlighted variant follows the active brand color.</p>
                </Card>
                <Card>
                  <span className={styles.cardKicker}>Hover Border</span>
                  <p>Border and surface tokens should stay visible across both themes.</p>
                </Card>
              </CardGrid>
            </div>

            <div className={styles.repoBand}>
              <TagChipStrip
                chips={[
                  { icon: 'pin', label: 'Kalymnos' },
                  { icon: 'mountain', label: 'Sport climbing' },
                  { icon: 'calendar', label: '7 days' },
                  { icon: 'gift', label: 'Coaching' },
                ]}
              />
            </div>

            <div className={styles.repoComponentGrid}>
              <div className={styles.formPrimitivePanel}>
                <FormBanner kind="success">Your booking profile is ready for checkout.</FormBanner>
                <FormBanner kind="error">Please choose an available trip date.</FormBanner>
                <FormField
                  name="theme-email"
                  label="Email"
                  type="email"
                  defaultValue="alex@example.com"
                  helpText="Existing form helper text should remain readable."
                />
                <FormField
                  name="theme-passport"
                  label="Passport name"
                  defaultValue="Alex Sender"
                  error="Use the exact name on your travel document."
                />
              </div>
              <PricingSidebar
                primaryPrice="EUR 1,390"
                secondaryPrice="Deposit EUR 290"
                caption="Per climber, shared accommodation included."
                rows={[
                  { label: 'Dates', value: '12-19 Oct' },
                  { label: 'Seats', value: '8 total' },
                  { label: 'Airport', value: 'Prague' },
                ]}
                callout="Early booking discount available"
                ctaHref="#"
                ctaLabel="Reserve"
              />
            </div>

            <div className={styles.catalogueSurface}>
              <BlockHeader
                eyebrow="Catalogue cards"
                heading="Domain Card Variants"
                intro="Cards from the block system show how theme values behave across trip, program, location, guide, post, and date surfaces."
              />
              <div className={styles.catalogueGrid}>
                <CatalogueTripCard event={sampleEvent} price="From EUR 1,390" lead />
                <ProgramCard program={sampleProgram} className={featuredCardClassName('feature')} />
                <LocationCard
                  location={sampleLocation}
                  className={featuredCardClassName('compact')}
                />
                <GuideCard guide={sampleGuide} className={featuredCardClassName('mediaLed')} />
                <PostCard post={samplePost} className={featuredCardClassName('compact')} />
                <EventDateCard
                  eventDate={sampleEventDate}
                  className={featuredCardClassName('feature')}
                />
              </div>
            </div>
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

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Token Atlas</h2>
            <p>
              Every registered editable token group rendered from the same registry as the editor.
            </p>
          </div>
          <div className={styles.tokenAtlas}>
            {themeTokenGroups.map((group) => {
              const tokens = themeTokens.filter((token) => token.group === group.id)

              return (
                <article className={styles.tokenAtlasGroup} key={group.id}>
                  <div className={styles.tokenAtlasHeader}>
                    <h3>{group.label}</h3>
                    <span>{tokens.length}</span>
                  </div>
                  <div className={styles.tokenAtlasGrid}>
                    {tokens.map((token) => (
                      <div className={styles.tokenAtlasItem} key={token.name}>
                        <div
                          className={`${styles.tokenAtlasSample} ${tokenSampleClass(token)}`}
                          style={{ ['--sample' as string]: `var(${token.name})` }}
                        >
                          {token.kind === 'font' ? 'Aa' : null}
                        </div>
                        <code>{token.name}</code>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </ThemeWorkbench>
  )
}
