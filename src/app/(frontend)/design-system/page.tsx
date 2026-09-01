import type {
  Event,
  EventDate,
  Faq,
  Guide,
  Location,
  Partner,
  Post,
  Program,
  Review,
} from '@/payload-types'
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
import { SubmitButton } from '@/components/forms/SubmitButton'
import { BookingCTA } from '@/components/sections/BookingCTA'
import { Card, CardGrid } from '@/components/sections/Card'
import { FAQList } from '@/components/sections/FAQList'
import { HighlightsGrid } from '@/components/sections/HighlightsGrid'
import { InlineFAQ } from '@/components/sections/InlineFAQ'
import { LocationBlock } from '@/components/sections/LocationBlock'
import { PartnerBlock } from '@/components/sections/PartnerBlock'
import { PricingSidebar } from '@/components/sections/PricingSidebar'
import { ReviewsRow } from '@/components/sections/ReviewsRow'
import { SectionIntro } from '@/components/sections/SectionIntro'
import { TagChipStrip } from '@/components/sections/TagChipStrip'
import { themeTokenGroups, themeTokens, type ThemeToken } from '@/lib/theme/tokenRegistry'
import styles from './page.module.css'
import { ThemeWorkbench } from './ThemeWorkbench'
import { WorkbenchTabs, type WorkbenchTab } from './WorkbenchTabs'

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

function richText(...paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', version: 1, text }],
        direction: null,
        format: '',
        indent: 0,
      })),
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

const sampleLocation = {
  id: 1,
  name: 'Kalymnos',
  slug: 'kalymnos',
  city: 'Masouri',
  country: 'Greece',
  content: richText(
    'North-facing crags, short transfers, and rest-day logistics make the venue useful for coached climbing weeks.',
    'The specimen renders without a media object so it stays independent from Payload uploads.',
  ),
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

const samplePartner = {
  id: 1,
  name: 'Rock Kit Lab',
} as unknown as Partner

const sampleEvent = {
  id: 1,
  title: 'Deep Blue Psicobloc',
  slug: 'deep-blue-psicobloc',
  shortDescription: 'A mixed week of coaching, rest-day logistics, and guided climbing by the sea.',
  locations: [sampleLocation],
  highlights: [
    { text: 'Daily movement coaching with a small climber group.' },
    { text: 'Clear route selection for changing conditions.' },
    { text: 'Evening debriefs that turn attempts into next-day tactics.' },
  ],
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

const sampleFaqs = [
  {
    id: 1,
    question: 'Do I need outdoor climbing experience?',
    answer: richText(
      'You should be comfortable belaying and climbing independently on sport routes.',
    ),
  },
  {
    id: 2,
    question: 'What happens if the weather changes?',
    answer: richText(
      'Guides adjust the daily plan around conditions, rest days, and sheltered sectors.',
    ),
  },
] as unknown as Faq[]

const sampleReviews = [
  {
    id: 1,
    quote: 'The coaching was specific enough that I knew exactly what to try on the next route.',
    reviewerName: 'Marta',
    reviewerLocation: 'Prague',
    resultLine: 'Moved from 6b to 6c projects',
  },
  {
    id: 2,
    quote:
      'The week felt organized without becoming rigid. We climbed where it made sense each day.',
    reviewerName: 'Jonas',
    reviewerLocation: 'Berlin',
    resultLine: 'First multi-day climbing trip',
  },
  {
    id: 3,
    quote: 'Small group feedback made the tactics click faster than another month in the gym.',
    reviewerName: 'Eva',
    reviewerLocation: 'Brno',
    resultLine: 'Cleaner onsight routine',
  },
] as unknown as Review[]

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
  const tabs: WorkbenchTab[] = [
    { id: 'tokens', label: 'Tokens', summary: 'Contract and atlas', content: <TokensPane /> },
    {
      id: 'typography',
      label: 'Typography',
      summary: 'Scale and prose',
      content: <TypographyPane />,
    },
    {
      id: 'components',
      label: 'Components',
      summary: 'Real specimens',
      content: <ComponentsPane />,
    },
    { id: 'patterns', label: 'Patterns', summary: 'Composed flows', content: <PatternsPane /> },
    { id: 'blocks', label: 'Blocks', summary: 'CMS strategy', content: <BlocksPane /> },
  ]

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
                <strong>5</strong>
                <span>Workbench panes</span>
              </div>
              <div className={styles.stat}>
                <strong>2</strong>
                <span>Brand skins</span>
              </div>
              <div className={styles.stat}>
                <strong>0</strong>
                <span>Persisted edits</span>
              </div>
            </div>
            <div className={styles.notice}>
              Components below intentionally consume semantic <code>--theme-*</code> tokens.
            </div>
          </aside>
        </div>
      </section>

      <div className={styles.content}>
        <WorkbenchTabs tabs={tabs} />
      </div>
    </ThemeWorkbench>
  )
}

function PaneHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.sectionHeading}>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  )
}

function TokensPane() {
  return (
    <div className={styles.paneStack}>
      <section className={styles.section}>
        <PaneHeading
          title="Foundation"
          body="Core page, surface, brand, and text tokens used by public UI sections."
        />
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
        <PaneHeading
          title="Detail Tokens"
          body="These values are intentionally separate per brand, not Snowbusters warm tokens."
        />
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
        <PaneHeading
          title="Token Atlas"
          body="Every registered editable token group rendered from the same registry as the editor."
        />
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
  )
}

function TypographyPane() {
  return (
    <div className={styles.paneStack}>
      <section className={styles.section}>
        <PaneHeading
          title="Typography"
          body="Scale, rhythm, form text, metadata, and rich-text behavior across both skins."
        />
        <div className={styles.typeWorkbench}>
          <article className={styles.typeScaleCard}>
            <p className={styles.eyebrow}>Type scale</p>
            <div className={styles.typeScaleRows}>
              <span style={{ ['--size' as string]: 'var(--theme-text-xs)' }}>
                Extra small metadata
              </span>
              <span style={{ ['--size' as string]: 'var(--theme-text-sm)' }}>
                Small interface text
              </span>
              <span style={{ ['--size' as string]: 'var(--theme-text-base)' }}>
                Body copy baseline
              </span>
              <span style={{ ['--size' as string]: 'var(--theme-text-lg)' }}>
                Large lead paragraph
              </span>
              <span style={{ ['--size' as string]: 'var(--theme-text-xl)' }}>
                Compact card heading
              </span>
              <span style={{ ['--size' as string]: 'var(--theme-text-2xl)' }}>
                Section subheading
              </span>
            </div>
          </article>

          <article className={styles.typeSpecimenWide}>
            <p className={styles.eyebrow}>Headings and body</p>
            <h2>Climb Longer With A Cleaner Plan</h2>
            <h3>Coaching, route choice, and logistics in one readable section.</h3>
            <p>
              Body copy uses the semantic body font and page text color. It needs enough measure,
              leading, and contrast to carry trip details, preparation notes, and account content.
            </p>
            <p className={styles.captionText}>
              Caption text supports photos, dense hints, and secondary rows.
            </p>
            <a id="typography-links" href="#typography-links">
              Inline links stay visible without overpowering the paragraph.
            </a>
          </article>

          <article className={styles.richTextSpecimen}>
            <p className={styles.eyebrow}>Rich text and lists</p>
            <h3>Preparation Notes</h3>
            <p>
              Bring a harness, shoes you trust, and enough skin care for repeated climbing days.
            </p>
            <ul>
              <li>Confirm travel windows before choosing an event date.</li>
              <li>Pack layers for shaded crags and coastal evenings.</li>
              <li>Share goals with the guide before the first climbing day.</li>
            </ul>
            <ol>
              <li>Warm up deliberately.</li>
              <li>Choose the right terrain.</li>
              <li>Record one practical adjustment.</li>
            </ol>
          </article>

          <article className={styles.dataTypeCard}>
            <p className={styles.eyebrow}>Metadata and stats</p>
            <dl>
              <div>
                <dt>Seats</dt>
                <dd>08</dd>
              </div>
              <div>
                <dt>Deposit</dt>
                <dd>EUR 290</dd>
              </div>
              <div>
                <dt>Difficulty</dt>
                <dd>6a-7a</dd>
              </div>
            </dl>
            <code>order.status.pending</code>
          </article>

          <form className={styles.formTextCard}>
            <p className={styles.eyebrow}>Form text</p>
            <label htmlFor="typography-name">Billing name</label>
            <input id="typography-name" defaultValue="Alex Sender" />
            <span className={styles.helpText}>Use the spelling from the travel document.</span>
            <span className={styles.errorText}>Billing name is required before checkout.</span>
          </form>
        </div>
      </section>
    </div>
  )
}

function ComponentsPane() {
  return (
    <div className={styles.paneStack}>
      <section className={styles.section}>
        <PaneHeading
          title="Components"
          body="Existing presentational components rendered with fixture data so token edits hit real app surfaces."
        />
        <div className={styles.specimenRows}>
          <article className={styles.specimenRow}>
            <div className={styles.specimenLabel}>
              <h3>Forms</h3>
              <p>FormField, FormBanner, and SubmitButton in a paper surface.</p>
            </div>
            <form className={styles.formPrimitivePanel}>
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
              <SubmitButton>Save profile</SubmitButton>
            </form>
          </article>

          <article className={styles.specimenRow}>
            <div className={styles.specimenLabel}>
              <h3>Section primitives</h3>
              <p>SectionIntro, cards, and chip strips for detail pages.</p>
            </div>
            <div className={styles.repoBand}>
              <SectionIntro
                eyebrow="SectionIntro"
                title="Real Section Rhythm"
                lead="This is the shared section intro used by trip and program detail blocks."
              />
              <CardGrid>
                <Card>
                  <span className={styles.cardKicker}>Default Card</span>
                  <p>Reusable detail cards inherit paper, ink, border, and primary accents.</p>
                </Card>
                <Card variant="highlighted">
                  <span className={styles.cardKicker}>Highlighted Card</span>
                  <p>The highlighted variant follows the active brand color.</p>
                </Card>
              </CardGrid>
              <TagChipStrip
                chips={[
                  { icon: 'pin', label: 'Kalymnos' },
                  { icon: 'mountain', label: 'Sport climbing' },
                  { icon: 'calendar', label: '7 days' },
                  { icon: 'gift', label: 'Coaching' },
                ]}
              />
            </div>
          </article>

          <article className={styles.specimenRow}>
            <div className={styles.specimenLabel}>
              <h3>Booking surfaces</h3>
              <p>PricingSidebar and BookingCTA without live availability or server actions.</p>
            </div>
            <div className={styles.bookingSpecimenGrid}>
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
                ctaHref={`/trips/${sampleEvent.slug}/dates`}
                ctaLabel="Reserve"
              />
              <BookingCTA
                event={sampleEvent}
                heading="Ready To Join The Week?"
                body="Fixture-only CTA using the trip slug path, with no booking mutation attached."
              />
            </div>
          </article>

          <article className={styles.specimenRow}>
            <div className={styles.specimenLabel}>
              <h3>Catalogue cards</h3>
              <p>Card exports from the block system across core domain entities.</p>
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
          </article>

          <article className={styles.specimenRow}>
            <div className={styles.specimenLabel}>
              <h3>Content sections</h3>
              <p>
                FAQ, reviews, highlights, location, and partner specimens with inline rich text.
              </p>
            </div>
            <div className={styles.contentSectionStack}>
              <FAQList items={sampleFaqs} heading="FAQList" />
              <InlineFAQ faqs={sampleFaqs} slug={sampleEvent.slug} />
              <ReviewsRow items={sampleReviews} />
              <HighlightsGrid items={sampleEvent.highlights} heading="HighlightsGrid" />
              <LocationBlock
                content={sampleLocation.content}
                heading="LocationBlock"
                eyebrow="The Venue"
              />
              <PartnerBlock
                partner={samplePartner}
                eyebrow="PartnerBlock"
                headline="Try the kit before committing."
                description="Fixture partner content shows logo fallback, benefit list, and panel contrast."
                benefits={[
                  { text: 'Demo shoes available on selected climbing days.' },
                  { text: 'Guide-approved hardware checks before the first route.' },
                ]}
              />
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

function PatternsPane() {
  return (
    <div className={styles.paneStack}>
      <section className={styles.section}>
        <PaneHeading
          title="Patterns"
          body="Composed examples for catalogue, booking, notices, calls to action, and dense surfaces."
        />
        <div className={styles.patternGrid}>
          <article className={styles.patternWide}>
            <div className={styles.patternHeader}>
              <h3>Catalogue grid</h3>
              <button className={`${styles.button} ${styles.primaryButton}`} type="button">
                View all trips
              </button>
            </div>
            <div className={styles.catalogueGrid}>
              <CatalogueTripCard event={sampleEvent} price="From EUR 1,390" />
              <ProgramCard program={sampleProgram} />
              <LocationCard location={sampleLocation} />
            </div>
          </article>

          <article className={styles.patternSplit}>
            <div>
              <SectionIntro
                eyebrow="Booking pattern"
                title="Reserve With Clear Costs"
                lead="Pair copy, dates, and a sticky price card without relying on live order state."
                align="left"
              />
              <div className={styles.noticeStack}>
                <FormBanner kind="success">
                  Deposit option is available for this fixture.
                </FormBanner>
                <FormBanner kind="error">Closed state copy stays legible on paper.</FormBanner>
              </div>
            </div>
            <PricingSidebar
              primaryPrice="EUR 1,390"
              secondaryPrice="Deposit EUR 290"
              caption="Per climber"
              rows={[
                { label: 'Start', value: '12 Oct' },
                { label: 'End', value: '19 Oct' },
                { label: 'Group', value: 'Max 8' },
              ]}
              ctaHref={`/trips/${sampleEvent.slug}/dates`}
              ctaLabel="Reserve"
            />
          </article>

          <article className={styles.patternWide}>
            <div className={styles.patternHeader}>
              <h3>Form banner plus fields</h3>
              <span className={styles.badge}>Account</span>
            </div>
            <form className={styles.inlineFormPattern}>
              <FormBanner kind="success">Saved locally in this browser preview only.</FormBanner>
              <FormField name="pattern-name" label="Name" defaultValue="Alex Sender" />
              <FormField
                name="pattern-email"
                label="Email"
                type="email"
                defaultValue="alex@example.com"
              />
              <SubmitButton>Continue</SubmitButton>
            </form>
          </article>

          <article className={styles.paperPattern}>
            <div className={styles.patternHeader}>
              <h3>Paper table</h3>
              <span className={styles.badge}>Admin-like</span>
            </div>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>RB-1024</td>
                  <td>
                    <span className={styles.successStatus}>Open</span>
                  </td>
                  <td>EUR 1,390</td>
                </tr>
                <tr>
                  <td>RB-1025</td>
                  <td>
                    <span className={styles.warningStatus}>Pending</span>
                  </td>
                  <td>EUR 290</td>
                </tr>
              </tbody>
            </table>
          </article>

          <article className={styles.detailCard}>
            <p className={styles.eyebrow}>Status stack</p>
            <h3>Notice hierarchy</h3>
            <div className={styles.statusPanel}>
              <span className={styles.infoStatus}>Info</span>
              <span className={styles.successStatus}>Open</span>
              <span className={styles.warningStatus}>Limited</span>
              <span className={styles.dangerStatus}>Closed</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

function BlocksPane() {
  return (
    <div className={styles.paneStack}>
      <section className={styles.section}>
        <PaneHeading
          title="Blocks"
          body="Strategy for rendering CMS block specimens in this playground without Payload reads or page contexts."
        />
        <div className={styles.blockStrategyGrid}>
          <article className={styles.blockStrategyCard}>
            <span className={styles.cardKicker}>Render directly</span>
            <h3>Pure presentational blocks</h3>
            <p>
              Blocks with all content supplied through props can appear here with inline fixtures.
              RichText, CTA, FAQ, media-free catalogue, and static section patterns belong in this
              group.
            </p>
          </article>
          <article className={styles.blockStrategyCard}>
            <span className={styles.cardKicker}>Adapter fixtures</span>
            <h3>Payload-shaped context blocks</h3>
            <p>
              Event, Program, Location, Guide, and Post context blocks should use small factory
              fixtures matching generated Payload types, with relationship and media fields
              optional.
            </p>
          </article>
          <article className={styles.blockStrategyCard}>
            <span className={styles.cardKicker}>Keep out</span>
            <h3>Integration blocks</h3>
            <p>
              Blocks that perform local API reads, auth checks, server actions, booking mutations,
              payment work, or persistence stay covered by route, integration, or e2e tests.
            </p>
          </article>
        </div>

        <div className={styles.blockMatrix}>
          {[
            ['Hero / Section Intro / CTA', 'Inline props', 'Safe for direct specimens'],
            ['Catalogue cards', 'Payload-shaped records', 'Use media-optional fixtures'],
            [
              'FAQ / Reviews / Highlights',
              'Inline arrays',
              'Render when Lexical fixtures are supplied',
            ],
            [
              'Booking / Orders / Payments',
              'Route context',
              'Strategy only unless explicitly isolated',
            ],
            ['Admin-only schemas', 'Payload admin', 'Do not render in playground'],
          ].map(([block, context, action]) => (
            <div className={styles.blockMatrixRow} key={block}>
              <strong>{block}</strong>
              <span>{context}</span>
              <p>{action}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
