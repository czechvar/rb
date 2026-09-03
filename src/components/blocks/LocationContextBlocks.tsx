import Image from 'next/image'
import type { Location } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { getPublishedEventsForLocation } from '@/lib/queries'
import { LocationBlock } from '@/components/sections/LocationBlock'
import { LinkedEvents } from '@/components/sections/LinkedEvents'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'

type LocationContextBlock = Record<string, unknown>
type DestinationDetail = NonNullable<Location['destinationDetail']>
type DestinationSection = NonNullable<DestinationDetail['sections']>[number]
type DestinationAudience = NonNullable<DestinationDetail['audience']>[number]
type DestinationSector = NonNullable<DestinationDetail['sectors']>[number]
type DestinationGearGroup = NonNullable<DestinationDetail['gearGroups']>[number]
type DestinationTransport = NonNullable<DestinationDetail['transportOptions']>[number]
type DestinationAccommodation = NonNullable<DestinationDetail['accommodationOptions']>[number]
type DestinationRestDay = NonNullable<DestinationDetail['restDayIdeas']>[number]
type DestinationAccessRule = NonNullable<DestinationDetail['accessRules']>[number]
type DestinationSafetyItem = NonNullable<DestinationDetail['safetyItems']>[number]
type DestinationCostItem = NonNullable<DestinationDetail['costItems']>[number]
type DestinationFaq = NonNullable<DestinationDetail['destinationFaqs']>[number]
type DestinationTripPromo = NonNullable<DestinationDetail['tripPromos']>[number]
type DestinationRelatedCard = NonNullable<DestinationDetail['relatedDestinationCards']>[number]

export function LocationHeroBlock(_block: LocationContextBlock, { location }: BlockRenderContext) {
  if (!isLocation(location)) return null

  const hero = mediaUrl(location.mainPicture)
  const place = [location.city, location.country].filter(Boolean).join(', ')

  return (
    <section className={styles.locationHero}>
      {hero ? (
        <Image
          src={hero}
          alt={mediaAlt(location.mainPicture) || location.name}
          fill
          priority
          sizes="100vw"
          className={styles.locationHeroImage}
        />
      ) : null}
      <div className={styles.locationHeroOverlay} />
      <div className={styles.locationHeroInner}>
        {place ? <p className={styles.eyebrow}>{place}</p> : null}
        <h1>{location.name}</h1>
      </div>
    </section>
  )
}

export function LocationContentBlock(
  block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null
  const body = destinationSectionBody(location, 'intro')

  return (
    <LocationBlock
      body={body}
      heading={typeof block.heading === 'string' ? block.heading : location.name}
      eyebrow={typeof block.eyebrow === 'string' ? block.eyebrow : location.country ?? undefined}
      image={location.mainPicture}
      imageAlt={location.name}
    />
  )
}

export function LocationMapBlock(block: LocationContextBlock, { location }: BlockRenderContext) {
  if (!isLocation(location)) return null

  const [lng, lat] = location.coordinates ?? [null, null]
  if (typeof lng !== 'number' || typeof lat !== 'number') return null

  const heading = typeof block.heading === 'string' ? block.heading : 'Where it is'

  return (
    <section className={styles.locationMapSection}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>{location.country}</p>
          <h2>{heading}</h2>
        </div>
        <div className={styles.locationMapFrame}>
          <iframe
            src={osmEmbedSrc(lng, lat)}
            title={`Map of ${location.name}`}
            loading="lazy"
          />
          <div className={styles.locationMapLabel}>
            <strong>{location.name}</strong>
            <span>{formatCoordinate(lat, 'N', 'S')} / {formatCoordinate(lng, 'E', 'W')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export async function LocationTripsBlock(
  _block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null

  const events = await getPublishedEventsForLocation(location.id)
  return <LinkedEvents events={events} />
}

export function DestinationHeroBlock(
  _block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null
  const detail = location.destinationDetail
  const hero = detail?.hero
  if (!hero?.heading) return null

  const image = mediaUrl(location.mainPicture)
  const heading = hero?.heading || location.name
  const place = hero?.eyebrow || [location.city, location.country].filter(Boolean).join(', ')
  const stats = hero?.heroStats?.filter((stat) => stat.value && stat.label) ?? []

  return (
    <section className={styles.destinationHero}>
      {image ? (
        <Image
          src={image}
          alt={mediaAlt(location.mainPicture) || location.name}
          fill
          priority
          sizes="100vw"
          className={styles.destinationHeroImage}
        />
      ) : null}
      <div className={styles.destinationHeroOverlay} />
      <div className={styles.destinationHeroInner}>
        {place ? <p className={styles.eyebrow}>{place}</p> : null}
        <h1>{renderHeadingWithAccent(heading, hero?.accentWord)}</h1>
        {hero?.body ? <p className={styles.destinationHeroBody}>{hero.body}</p> : null}
        {hero?.primaryAction?.label && hero.primaryAction.href ? (
          <a className={styles.primaryButton} href={hero.primaryAction.href}>
            {hero.primaryAction.label}
          </a>
        ) : null}
      </div>
      {stats.length ? (
        <dl className={styles.destinationHeroStats}>
          {stats.map((stat) => (
            <div key={stat.id ?? `${stat.value}-${stat.label}`} className={styles.destinationHeroStat}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}

export function DestinationSectionsBlock(
  block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null
  const sections = selectDestinationSections(location.destinationDetail?.sections, block)
  if (!sections.length) return null

  const heading = stringValue(block.heading) || sections[0]?.heading
  const eyebrow = stringValue(block.eyebrow)

  if (sections.length === 1) {
    const section = sections[0]
    return (
      <section className={styles.destinationSectionBand}>
        <div className={styles.sectionInner}>
          <article
            id={destinationSectionId(section)}
            className={`${styles.destinationEditorialPanel} ${styles.destinationEditorialPanelSolo}`}
          >
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            {heading ? <h2>{heading}</h2> : null}
            {paragraphs(section.body).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.keyCharacteristics?.length ? (
              <ul className={styles.destinationBulletList}>
                {section.keyCharacteristics.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </article>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.destinationSectionBand}>
      <div className={styles.sectionInner}>
        <div className={styles.destinationSectionLayout}>
          <aside className={styles.destinationSectionNav}>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            {heading ? <h2>{heading}</h2> : null}
            <ol>
              {sections.map((section) => (
                <li key={section.id ?? section.key}>
                  <a href={`#${destinationSectionId(section)}`}>{section.navLabel || section.heading}</a>
                </li>
              ))}
            </ol>
          </aside>
          <div className={styles.destinationEditorialStack}>
            {sections.map((section) => (
              <article
                key={section.id ?? section.key}
                id={destinationSectionId(section)}
                className={styles.destinationEditorialPanel}
              >
                <h3>{section.heading}</h3>
                {paragraphs(section.body).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.keyCharacteristics?.length ? (
                  <ul className={styles.destinationBulletList}>
                    {section.keyCharacteristics.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function DestinationCardGridBlock(
  block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null
  const cards = destinationCards(location.destinationDetail, stringValue(block.source))
  if (!cards.length) return null

  const heading = stringValue(block.heading) || destinationCardHeading(stringValue(block.source))
  const eyebrow = stringValue(block.eyebrow)
  const intro = stringValue(block.intro)
  const columns = stringValue(block.columns)

  return (
    <section className={styles.destinationDarkBand}>
      <div className={styles.sectionInner}>
        <DestinationBlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <div className={`${styles.destinationCardGrid} ${destinationColumnsClass(columns)}`}>
          {cards.map((card) => (
            <article key={card.key} className={styles.destinationDetailCard}>
              {card.meta ? <p className={styles.destinationDetailCardMeta}>{card.meta}</p> : null}
              <h3>{card.href ? <a href={card.href}>{card.title}</a> : card.title}</h3>
              {card.body ? <p>{card.body}</p> : null}
              {card.badges.length ? (
                <ul className={styles.destinationBadgeList}>
                  {card.badges.map((badge) => (
                    <li key={badge}>{badge}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function DestinationSeasonBlock(
  block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null
  const months = [...(location.destinationDetail?.seasonMonths ?? [])]
    .filter((month) => month.label && typeof month.score === 'number')
    .sort((a, b) => a.month - b.month)
  if (!months.length) return null

  return (
    <section className={styles.destinationSeasonBand}>
      <div className={styles.sectionInner}>
        <DestinationBlockHeader
          eyebrow={stringValue(block.eyebrow)}
          heading={stringValue(block.heading) || 'When to go'}
          intro={stringValue(block.intro)}
        />
        <div className={styles.destinationMonthGrid}>
          {months.map((month) => (
            <article key={month.id ?? month.label} className={styles.destinationMonth}>
              <div className={styles.destinationMonthTopline}>
                <h3>{month.label}</h3>
                <span>{month.score}/5</span>
              </div>
              <div
                className={styles.destinationScoreTrack}
                aria-label={`${month.label} climbing season score ${month.score} out of 5`}
              >
                <span style={{ width: `${Math.max(0, Math.min(month.score, 5)) * 20}%` }} />
              </div>
              {month.conditions ? <p>{month.conditions}</p> : null}
              {month.temperature ? <small>{month.temperature}</small> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function DestinationLogisticsBlock(
  block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null
  const groups = logisticsGroups(location.destinationDetail, stringValue(block.source))
  if (!groups.length) return null
  const singleGroup = groups.length === 1

  return (
    <section className={styles.destinationDarkBand}>
      <div className={styles.sectionInner}>
        <DestinationBlockHeader
          eyebrow={stringValue(block.eyebrow)}
          heading={stringValue(block.heading) || 'Plan the trip'}
          intro={stringValue(block.intro)}
        />
        <div
          className={[
            styles.destinationLogisticsGrid,
            singleGroup ? styles.destinationLogisticsGridSingle : '',
          ].filter(Boolean).join(' ')}
        >
          {groups.map((group) => (
            <article
              key={group.key}
              className={[
                styles.destinationLogisticsGroup,
                singleGroup ? styles.destinationLogisticsGroupList : '',
              ].filter(Boolean).join(' ')}
            >
              <h3>{group.heading}</h3>
              <div className={styles.destinationLogisticsItems}>
                {group.items.map((item) => (
                  <div key={item.key} className={styles.destinationLogisticsItem}>
                    <strong>{item.title}</strong>
                    {item.meta ? <span>{item.meta}</span> : null}
                    {item.body ? <p>{item.body}</p> : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function DestinationSidebarBlock(
  block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null
  const detail = location.destinationDetail
  if (!detail) return null

  const includeCta = booleanValue(block.includeCta, true)
  const includeQuickFacts = booleanValue(block.includeQuickFacts, true)
  const includeAccommodationLinks = booleanValue(block.includeAccommodationLinks, true)
  const includeResources = booleanValue(block.includeResources, true)
  const includeEmergencyContacts = booleanValue(block.includeEmergencyContacts, true)

  const quickFacts = destinationQuickFacts(location)
  const accommodationLinks = destinationAccommodationLinks(detail)
  const resourceLinks = destinationResourceLinks(location)
  const emergencyContacts = destinationEmergencyContacts(detail)
  const cta = includeCta && detail.cta?.heading ? detail.cta : null

  if (
    !cta &&
    (!includeQuickFacts || !quickFacts.length) &&
    (!includeAccommodationLinks || !accommodationLinks.length) &&
    (!includeResources || !resourceLinks.length) &&
    (!includeEmergencyContacts || !emergencyContacts.length)
  ) {
    return null
  }

  return (
    <div className={styles.destinationSidebar}>
      {cta ? (
        <aside className={styles.destinationSidebarCta}>
          {cta.eyebrow ? <p>{cta.eyebrow}</p> : null}
          <h2>{cta.heading}</h2>
          {cta.body ? <p>{cta.body}</p> : null}
          <DestinationSidebarActions cta={cta} />
        </aside>
      ) : null}
      {includeQuickFacts && quickFacts.length ? (
        <DestinationSidebarTable title="Quick facts" rows={quickFacts} />
      ) : null}
      {includeAccommodationLinks && accommodationLinks.length ? (
        <DestinationSidebarLinks title="Book accommodation" links={accommodationLinks} />
      ) : null}
      {includeResources && resourceLinks.length ? (
        <DestinationSidebarLinks title="Resources" links={resourceLinks} />
      ) : null}
      {includeEmergencyContacts && emergencyContacts.length ? (
        <DestinationSidebarTable title="Emergency contacts" rows={emergencyContacts} />
      ) : null}
    </div>
  )
}

function osmEmbedSrc(lng: number, lat: number) {
  const bbox = [lng - 0.05, lat - 0.03, lng + 0.05, lat + 0.03].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

function formatCoordinate(value: number, positive: string, negative: string) {
  const direction = value >= 0 ? positive : negative
  return `${Math.abs(value).toFixed(2)}° ${direction}`
}

function isLocation(location: unknown): location is Location {
  return typeof location === 'object' && location !== null
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function paragraphs(value: string | null | undefined) {
  return String(value ?? '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function destinationSectionBody(location: Location, key: string) {
  return location.destinationDetail?.sections?.find((section) => section.key === key)?.body ?? null
}

function renderHeadingWithAccent(heading: string, accentWord: string | null | undefined) {
  if (!accentWord) return heading
  const index = heading.toLowerCase().indexOf(accentWord.toLowerCase())
  if (index === -1) return heading

  return (
    <>
      {heading.slice(0, index)}
      <span className={styles.heroAccentWord}>{heading.slice(index, index + accentWord.length)}</span>
      {heading.slice(index + accentWord.length)}
    </>
  )
}

function selectDestinationSections(
  sections: DestinationDetail['sections'] | null | undefined,
  block: LocationContextBlock,
) {
  const requestedKeys = Array.isArray(block.sectionKeys)
    ? block.sectionKeys
        .map((item) => (typeof item === 'object' && item ? stringValue((item as { key?: unknown }).key) : undefined))
        .filter((key): key is string => Boolean(key))
    : []

  const available = (sections ?? []).filter((section) => section.key && section.heading)
  if (!requestedKeys.length) return available

  return available.filter((section) => requestedKeys.includes(section.key))
}

function destinationSectionId(section: DestinationSection) {
  return `destination-${section.key.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()}`
}

type DestinationCard = {
  key: string
  title: string
  body?: string | null
  meta?: string | null
  href?: string
  badges: string[]
}

function destinationCards(detail: DestinationDetail | null | undefined, source = 'audience') {
  if (!detail) return []

  switch (source) {
    case 'sectors':
      return (detail.sectors ?? []).map((item) => sectorCard(item))
    case 'restDayIdeas':
      return (detail.restDayIdeas ?? []).map((item) => restDayCard(item))
    case 'accessRules':
      return (detail.accessRules ?? []).map((item) => accessRuleCard(item))
    case 'safetyItems':
      return (detail.safetyItems ?? []).map((item) => safetyCard(item))
    case 'destinationFaqs':
      return (detail.destinationFaqs ?? []).map((item) => faqCard(item))
    case 'tripPromos':
      return (detail.tripPromos ?? []).map((item) => tripPromoCard(item))
    case 'relatedLocations':
      return (detail.relatedLocations ?? []).filter(isLocation).map((item) => relatedLocationCard(item))
    case 'relatedDestinationCards':
      return (detail.relatedDestinationCards ?? []).map((item) => relatedDestinationCard(item))
    case 'audience':
    default:
      return (detail.audience ?? []).map((item) => audienceCard(item))
  }
}

function audienceCard(item: DestinationAudience): DestinationCard {
  return {
    key: item.id ?? item.label,
    title: item.label,
    body: item.body,
    meta: item.gradeRange,
    badges: [item.badge].filter(Boolean) as string[],
  }
}

function sectorCard(item: DestinationSector): DestinationCard {
  return {
    key: item.id ?? item.name,
    title: item.name,
    body: item.body,
    meta: item.gradeRange,
    badges: item.badges ?? [],
  }
}

function restDayCard(item: DestinationRestDay): DestinationCard {
  return {
    key: item.id ?? item.title,
    title: item.title,
    body: item.body,
    meta: item.distance,
    badges: [],
  }
}

function accessRuleCard(item: DestinationAccessRule): DestinationCard {
  return {
    key: item.id ?? item.title,
    title: item.title,
    body: item.body,
    meta: item.tone,
    badges: [],
  }
}

function safetyCard(item: DestinationSafetyItem): DestinationCard {
  return {
    key: item.id ?? item.label,
    title: item.label,
    body: item.body,
    meta: item.value,
    badges: [],
  }
}

function faqCard(item: DestinationFaq): DestinationCard {
  return {
    key: item.id ?? item.question,
    title: item.question,
    body: item.answer,
    badges: [],
  }
}

function tripPromoCard(item: DestinationTripPromo): DestinationCard {
  return {
    key: item.id ?? item.title,
    title: item.title,
    body: item.body,
    meta: item.type,
    href: item.action?.href ?? undefined,
    badges: item.action?.label ? [item.action.label] : [],
  }
}

function relatedLocationCard(item: Location): DestinationCard {
  return {
    key: String(item.id),
    title: item.name,
    body: [item.city, item.country].filter(Boolean).join(', '),
    href: `/destinations/${item.slug}`,
    badges: item.country ? [item.country] : [],
  }
}

function relatedDestinationCard(item: DestinationRelatedCard): DestinationCard {
  return {
    key: item.id ?? item.slug ?? item.name,
    title: item.name,
    body: item.summary,
    meta: [item.region, item.country].filter(Boolean).join(', '),
    href: item.slug ? `/destinations/${item.slug}` : undefined,
    badges: item.country ? [item.country] : [],
  }
}

function destinationCardHeading(source: string | undefined) {
  switch (source) {
    case 'sectors':
      return 'Sectors'
    case 'restDayIdeas':
      return 'Rest days'
    case 'accessRules':
      return 'Access notes'
    case 'safetyItems':
      return 'Safety'
    case 'destinationFaqs':
      return 'Frequently asked questions'
    case 'tripPromos':
      return 'Trips'
    case 'relatedLocations':
    case 'relatedDestinationCards':
      return 'Related destinations'
    case 'audience':
    default:
      return 'Who is it for?'
  }
}

function destinationColumnsClass(columns: string | undefined) {
  if (columns === '2') return styles.destinationCardGridTwo
  if (columns === '3') return styles.destinationCardGridThree
  return ''
}

function DestinationBlockHeader({
  eyebrow,
  heading,
  intro,
}: {
  eyebrow?: string
  heading?: string
  intro?: string
}) {
  if (!eyebrow && !heading && !intro) return null

  return (
    <div className={styles.sectionHeader}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className={styles.lead}>{intro}</p> : null}
    </div>
  )
}

type LogisticsGroup = {
  key: string
  heading: string
  items: {
    key: string
    title: string
    body?: string | null
    meta?: string | null
  }[]
}

function logisticsGroups(detail: DestinationDetail | null | undefined, source = 'all') {
  if (!detail) return []

  const groups: LogisticsGroup[] = []
  if (source === 'all' || source === 'gearGroups') {
    groups.push(
      ...(detail.gearGroups ?? []).map((group) => ({
        key: group.id ?? `gear-${group.heading}`,
        heading: group.heading,
        items: gearItems(group),
      })),
    )
  }
  if (source === 'all' || source === 'transportOptions') {
    groups.push({
      key: 'transport',
      heading: 'Transport',
      items: (detail.transportOptions ?? []).map((item) => transportItem(item)),
    })
  }
  if (source === 'all' || source === 'accommodationOptions') {
    groups.push({
      key: 'accommodation',
      heading: 'Accommodation',
      items: (detail.accommodationOptions ?? []).map((item) => accommodationItem(item)),
    })
  }
  if (source === 'all' || source === 'costItems') {
    groups.push({
      key: 'costs',
      heading: 'Costs',
      items: (detail.costItems ?? []).map((item) => costItem(item)),
    })
  }

  return groups.filter((group) => group.items.length)
}

function gearItems(group: DestinationGearGroup) {
  return (group.items ?? []).map((item) => ({
    key: item,
    title: item,
  }))
}

function transportItem(item: DestinationTransport) {
  return {
    key: item.id ?? item.label,
    title: item.label,
    body: item.body,
    meta: [item.type, item.duration, item.recommended ? 'Recommended' : null].filter(Boolean).join(' / '),
  }
}

function accommodationItem(item: DestinationAccommodation) {
  return {
    key: item.id ?? item.name,
    title: item.name,
    body: item.body,
    meta: [item.type, item.priceHint].filter(Boolean).join(' / '),
  }
}

function costItem(item: DestinationCostItem) {
  return {
    key: item.id ?? item.label,
    title: item.label,
    meta: [item.unit, item.budget, item.midRange].filter(Boolean).join(' / '),
  }
}

type SidebarRow = {
  key: string
  label: string
  value: string
}

type SidebarLink = {
  key: string
  label: string
  href: string
}

function DestinationSidebarTable({ title, rows }: { title: string; rows: SidebarRow[] }) {
  return (
    <section className={styles.destinationSidebarWidget}>
      <h2>{title}</h2>
      <dl>
        {rows.map((row) => (
          <div key={row.key} className={styles.destinationSidebarRow}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function DestinationSidebarLinks({ title, links }: { title: string; links: SidebarLink[] }) {
  return (
    <section className={styles.destinationSidebarWidget}>
      <h2>{title}</h2>
      <ul className={styles.destinationSidebarLinks}>
        {links.map((link) => (
          <li key={link.key}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function DestinationSidebarActions({ cta }: { cta: NonNullable<DestinationDetail['cta']> }) {
  const actions = [cta.primaryAction, cta.secondaryAction].filter(
    (action): action is { label?: string | null; href?: string | null } =>
      Boolean(action?.label && action.href),
  )
  if (!actions.length) return null

  return (
    <div className={styles.destinationSidebarActions}>
      {actions.map((action, index) => (
        <a
          key={`${action.href}-${action.label}`}
          className={index === 0 ? styles.primaryButton : styles.secondaryButton}
          href={action.href ?? '#'}
        >
          {action.label}
        </a>
      ))}
    </div>
  )
}

function destinationQuickFacts(location: Location): SidebarRow[] {
  const detail = location.destinationDetail
  const heroStats = detail?.hero?.heroStats ?? []
  const row = (key: string, label: string, value: string | null | undefined): SidebarRow | null =>
    value ? { key, label, value } : null

  return [
    row('country', 'Country', location.country),
    row('region', 'Region', [location.city, location.country].filter(Boolean).join(', ')),
    row('rock', 'Rock', formatTaxonomyList(location.rockTypes)),
    row('style', 'Style', formatTaxonomyList(location.climbingStyles)),
    row('problems', 'Problems', findHeroStat(heroStats, 'problems')),
    row('grades', 'Grades', findHeroStat(heroStats, 'grade')),
    row('best-season', 'Best season', findHeroStat(heroStats, 'season') ?? bestSeasonFromMonths(detail)),
    row('airport', 'Airport', recommendedTransport(detail)),
    row('camping', 'Camping', campingStatus(detail)),
    row('crag-fee', 'Crag fee', climbingAccessCost(detail)),
  ].filter((item): item is SidebarRow => Boolean(item))
}

function destinationAccommodationLinks(detail: DestinationDetail): SidebarLink[] {
  return (detail.accommodationOptions ?? [])
    .filter((item) => item.href && item.actionLabel)
    .map((item) => ({
      key: item.id ?? item.href ?? item.name,
      label: item.actionLabel ?? item.name,
      href: item.href ?? '#',
    }))
}

function destinationResourceLinks(location: Location): SidebarLink[] {
  return (location.sourceReferences ?? [])
    .filter((item) => item.url && item.title)
    .map((item) => ({
      key: item.id ?? item.url ?? item.title ?? 'resource',
      label: item.title ?? item.url ?? 'Resource',
      href: item.url ?? '#',
    }))
}

function destinationEmergencyContacts(detail: DestinationDetail): SidebarRow[] {
  return (detail.safetyItems ?? [])
    .filter((item) => item.value)
    .map((item) => ({
      key: item.id ?? item.label,
      label: item.label,
      value: item.value ?? '',
    }))
}

function formatTaxonomyList(values: string[] | null | undefined) {
  return values?.length ? values.map(formatTaxonomyLabel).join(', ') : undefined
}

function formatTaxonomyLabel(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function findHeroStat(
  stats: NonNullable<DestinationDetail['hero']>['heroStats'] | null | undefined,
  needle: string,
) {
  return stats?.find((stat) => stat.label.toLowerCase().includes(needle))?.value
}

function bestSeasonFromMonths(detail: DestinationDetail | null | undefined) {
  const months = detail?.seasonMonths?.filter((month) => month.score >= 4).sort((a, b) => a.month - b.month) ?? []
  if (!months.length) return undefined
  const first = months.at(0)?.label
  const last = months.at(-1)?.label
  return first && last && first !== last ? `${first}-${last}` : first
}

function recommendedTransport(detail: DestinationDetail | null | undefined) {
  const item = detail?.transportOptions?.find((option) => option.recommended) ?? detail?.transportOptions?.at(0)
  if (!item) return undefined
  return [item.label, item.duration].filter(Boolean).join(' / ')
}

function campingStatus(detail: DestinationDetail | null | undefined) {
  const hasCamping = detail?.accommodationOptions?.some((item) =>
    [item.type, item.name].some((value) => value?.toLowerCase().includes('camp')),
  )
  return hasCamping ? 'Yes' : undefined
}

function climbingAccessCost(detail: DestinationDetail | null | undefined) {
  const access = detail?.costItems?.find((item) => item.label.toLowerCase().includes('access'))
  return access ? [access.budget, access.midRange].filter(Boolean).join(' / ') : undefined
}
