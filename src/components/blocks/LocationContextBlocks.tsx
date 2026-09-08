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
  const overlayStats = destinationHeroOverlayStats(location)

  return (
    <>
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
        {overlayStats.length ? (
          <dl className={styles.destinationHeroOverlayStats} aria-label="Destination quick facts">
            {overlayStats.map((stat) => (
              <div key={stat.label} className={styles.destinationHeroOverlayStat}>
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>
      {stats.length ? (
        <section className={styles.destinationHeroStatsBar} aria-label="Destination hero stats">
          <dl className={styles.destinationHeroStats}>
            {stats.map((stat) => (
              <div key={stat.id ?? `${stat.value}-${stat.label}`} className={styles.destinationHeroStat}>
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </>
  )
}

function destinationHeroOverlayStats(location: Location) {
  const detail = location.destinationDetail
  const bestSeason = bestSeasonFromMonths(detail)
  return [
    location.problemCount ? { value: formatCount(location.problemCount), label: 'Problems' } : null,
    location.gradeRange ? { value: compactGradeRange(location.gradeRange), label: 'Grade range' } : null,
    location.sectorCount ? { value: formatCount(location.sectorCount), label: 'Sectors' } : null,
    bestSeason ? { value: bestSeason, label: 'Best season' } : null,
  ].filter((item): item is { value: string; label: string } => Boolean(item?.value))
}

function formatCount(value: number) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}+`
}

function compactGradeRange(value: string) {
  const match = value.match(/(?:Font|French|UIAA|V)\s*([\w+-]+)\s+to\s+([\w+-]+)/i)
  if (!match) return value
  const system = match[0].match(/^(Font|French|UIAA|V)/i)?.[1]
  const prefix = system && system.toLowerCase() !== 'v' ? `${system} ` : system?.toUpperCase() ?? ''
  return `${prefix}${match[1]}-${match[2]}`
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

export function DestinationIntroStatsBlock(
  _block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null
  const stats = destinationIntroStats(location)
  if (!stats.length) return null

  return (
    <section className={styles.destinationIntroStatsBand} aria-label="Destination introduction stats">
      <div className={styles.sectionInner}>
        <dl className={styles.destinationIntroStats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.destinationIntroStat}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
              {stat.note ? <small>{stat.note}</small> : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function DestinationRockStatsBlock(
  _block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null
  const stats = destinationRockStats(location)
  if (!stats.length) return null

  return (
    <section className={`${styles.destinationIntroStatsBand} ${styles.destinationRockStatsBand}`} aria-label="Destination rock stats">
      <div className={styles.sectionInner}>
        <dl className={styles.destinationIntroStats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.destinationIntroStat}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
              {stat.note ? <small>{stat.note}</small> : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function DestinationMediaBreakBlock(
  block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null
  const variant = stringValue(block.variant) === 'split' ? 'split' : 'strip'
  const offset = numberValue(block.offset, 0)
  const count = variant === 'split' ? 2 : 4
  const media = destinationMediaBreakItems(location, offset, count)
  if (media.length < count) return null

  return (
    <section
      className={[
        styles.destinationMediaBreak,
        variant === 'split' ? styles.destinationMediaBreakSplit : styles.destinationMediaBreakStrip,
      ].join(' ')}
      aria-label="Destination images"
    >
      {media.map((item) => (
        <figure key={item.src} className={styles.destinationMediaBreakItem}>
          <Image src={item.src} alt={item.alt} fill sizes={variant === 'split' ? '50vw' : '25vw'} />
        </figure>
      ))}
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
  const anchorId = stringValue(block.anchorId)

  return (
    <section id={anchorId} className={styles.destinationDarkBand}>
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
  const anchorId = stringValue(block.anchorId)

  return (
    <section id={anchorId} className={styles.destinationSeasonBand}>
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
  const variant = stringValue(block.variant) === 'list' ? 'list' : 'cards'
  const singleGroup = groups.length === 1
  const anchorId = stringValue(block.anchorId)
  const header = (
    <DestinationBlockHeader
      eyebrow={stringValue(block.eyebrow)}
      heading={stringValue(block.heading) || 'Plan the trip'}
      intro={stringValue(block.intro)}
    />
  )

  if (variant === 'cards') {
    const cards = groups.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        group: group.heading,
      })),
    )

    return (
      <section id={anchorId} className={styles.destinationDarkBand}>
        <div className={styles.sectionInner}>
          {header}
          <div className={`${styles.destinationCardGrid} ${styles.destinationCardGridTwo}`}>
            {cards.map((card) => (
              <article key={`${card.group}-${card.key}`} className={styles.destinationDetailCard}>
                <p className={styles.destinationDetailCardMeta}>{card.group}</p>
                <h3>{card.title}</h3>
                {card.meta ? <p className={styles.destinationDetailCardSubMeta}>{card.meta}</p> : null}
                {card.body ? <p>{card.body}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id={anchorId} className={styles.destinationDarkBand}>
      <div className={styles.sectionInner}>
        {header}
        <div
          className={[
            styles.destinationLogisticsGrid,
            variant === 'list' && singleGroup ? styles.destinationLogisticsGridSingle : '',
          ].filter(Boolean).join(' ')}
        >
          {groups.map((group) => (
            <article
              key={group.key}
              className={[
                styles.destinationLogisticsGroup,
                variant === 'list' && singleGroup ? styles.destinationLogisticsGroupList : '',
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

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
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

type DestinationIntroStat = {
  label: string
  value: string
  note?: string
}

function destinationIntroStats(location: Location) {
  const detail = location.destinationDetail
  const heroStats = detail?.hero?.heroStats ?? []
  const problemCount = findHeroStatItem(heroStats, 'problem')
  const gradeRange = findHeroStatItem(heroStats, 'grade')
  const airport = recommendedTransport(detail)
  const rockType = formatTaxonomyList(location.rockTypes)

  const stats: Array<DestinationIntroStat | null> = [
    rockType
      ? {
          label: 'Rock type',
          value: rockType,
          note: 'Primary climbing medium',
        }
      : null,
    problemCount
      ? {
          label: 'Total problems',
          value: problemCount.value,
          note: problemCount.note
            ?? (location.sectorCount ? `Across ${formatCount(location.sectorCount)} sectors` : undefined),
        }
      : location.problemCount
        ? {
            label: 'Total problems',
            value: formatCount(location.problemCount),
            note: location.sectorCount ? `Across ${formatCount(location.sectorCount)} sectors` : undefined,
          }
      : null,
    gradeRange
      ? {
          label: 'Grade range',
          value: compactGradeRange(gradeRange.value),
          note: gradeRange.note ?? gradeSweetSpot(location),
        }
      : location.gradeRange
        ? {
            label: 'Grade range',
            value: compactGradeRange(location.gradeRange),
            note: gradeSweetSpot(location),
          }
      : null,
    airport
      ? {
          label: 'Nearest airport',
          value: airport.split('/')[0]?.trim() ?? airport,
          note: airport.includes('/') ? airport.split('/').slice(1).join('/').trim() : undefined,
        }
      : null,
    familyFriendlyStat(detail),
    dogFriendlyStat(detail),
  ]

  return stats.filter((item): item is DestinationIntroStat => Boolean(item?.value))
}

function gradeSweetSpot(location: Location) {
  const audienceRange = location.destinationDetail?.audience
    ?.filter((item) => !item.label.toLowerCase().includes('famil'))
    ?.map((item) => item.gradeRange)
    .find((range): range is string => Boolean(range))
  return audienceRange ? `Sweet spot ${compactGradeRange(audienceRange)}` : undefined
}

function familyFriendlyStat(detail: DestinationDetail | null | undefined): DestinationIntroStat | null {
  const family = detail?.audience?.find((item) => item.label.toLowerCase().includes('famil'))
  if (!family) return null
  return {
    label: 'Family friendly',
    value: 'Yes',
    note: family.body ?? family.badge ?? undefined,
  }
}

function dogFriendlyStat(detail: DestinationDetail | null | undefined): DestinationIntroStat | null {
  const dogRule = detail?.accessRules?.find((item) =>
    [item.title, item.body].some((value) => value?.toLowerCase().includes('dog')),
  )
  if (!dogRule) return null

  return {
    label: 'Dog friendly',
    value: ['avoid', 'critical'].includes(dogRule.tone ?? '') ? 'Check access' : 'Yes',
    note: dogRule.body ?? dogRule.title,
  }
}

function destinationRockStats(location: Location) {
  const rockSection = location.destinationDetail?.sections?.find((section) => section.key === 'rock')
  const rockType = formatTaxonomyList(location.rockTypes)
  const style = formatTaxonomyList(location.climbingStyles)
  const averageHeight = extractRockHeight(location)
  const friction = extractFrictionNote(location)

  const stats: Array<DestinationIntroStat | null> = [
    rockType
      ? {
          label: 'Rock type',
          value: rockType,
          note: firstMatchingCharacteristic(rockSection, ['sandstone', 'limestone', 'granite', 'conglomerate'])
            ?? 'Primary climbing medium',
        }
      : null,
    averageHeight,
    friction,
    style
      ? {
          label: 'Style',
          value: style,
          note: firstMatchingCharacteristic(rockSection, ['sloper', 'crimp', 'compression', 'technical', 'steep']),
        }
      : null,
  ]

  return stats.filter((item): item is DestinationIntroStat => Boolean(item?.value)).slice(0, 3)
}

function extractRockHeight(location: Location): DestinationIntroStat | null {
  const text = destinationSearchText(location, ['intro', 'rock'])
  const rangeMatch = text.match(/(\d+)\s*[–-]\s*(\d+)\s*(?:m|metres|meters)\b/i)
  if (rangeMatch) {
    return {
      label: 'Average height',
      value: `${rangeMatch[1]}-${rangeMatch[2]}m`,
      note: 'Typical boulder height',
    }
  }

  const underMatch = text.match(/(?:under|below|less than)\s+(\d+)\s*(?:m|metres|meters)\b/i)
  if (underMatch) {
    return {
      label: 'Average height',
      value: `Under ${underMatch[1]}m`,
      note: 'Low, pad-friendly climbing',
    }
  }

  const bouldering = location.climbingStyles?.includes('bouldering')
  return bouldering
    ? {
        label: 'Average height',
        value: 'Low',
        note: 'Bouldering venue',
      }
    : null
}

function extractFrictionNote(location: Location): DestinationIntroStat | null {
  const text = destinationSearchText(location, ['intro', 'rock', 'season'])
  const excellent = text.match(/\b(excellent|good|perfect)\s+friction\b/i)
  if (excellent) {
    return {
      label: 'Friction',
      value: capitalize(excellent[1]),
      note: 'In dry, cool conditions',
    }
  }

  const season = bestSeasonFromMonths(location.destinationDetail)
  if (!season) return null

  return {
    label: 'Friction',
    value: 'Best cool',
    note: season,
  }
}

function destinationSearchText(location: Location, keys: string[]) {
  const sections = location.destinationDetail?.sections ?? []
  return sections
    .filter((section) => keys.includes(section.key))
    .flatMap((section) => [section.body, ...(section.keyCharacteristics ?? [])])
    .filter(Boolean)
    .join(' ')
}

function firstMatchingCharacteristic(
  section: DestinationSection | undefined,
  needles: string[],
) {
  return section?.keyCharacteristics?.find((item) =>
    needles.some((needle) => item.toLowerCase().includes(needle)),
  )
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`
}

function destinationMediaBreakItems(location: Location, offset: number, count: number) {
  const candidates = [location.mainPicture, ...(location.gallery ?? [])]
    .map((media) => {
      const src = mediaUrl(media)
      if (!src) return null
      return {
        src,
        alt: mediaAlt(media) || location.name,
      }
    })
    .filter((item): item is { src: string; alt: string } => Boolean(item))

  if (candidates.length < count) return []
  return candidates.slice(offset, offset + count).length === count
    ? candidates.slice(offset, offset + count)
    : candidates.slice(0, count)
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

function findHeroStatItem(
  stats: NonNullable<DestinationDetail['hero']>['heroStats'] | null | undefined,
  needle: string,
) {
  const stat = stats?.find((item) => item.label.toLowerCase().includes(needle))
  if (!stat?.value) return undefined
  return {
    value: stat.value,
    note: stat.note ?? undefined,
  }
}

function bestSeasonFromMonths(detail: DestinationDetail | null | undefined) {
  const months = detail?.seasonMonths?.filter((month) => month.score >= 4).sort((a, b) => a.month - b.month) ?? []
  if (!months.length) return undefined

  const labels = new Map(months.map((month) => [month.month, month.label]))
  const selected = new Set(months.map((month) => month.month))
  const groups: Array<{ start: number; end: number }> = []

  for (let month = 1; month <= 12; month += 1) {
    if (!selected.has(month) || selected.has(month - 1)) continue
    let end = month
    while (end < 12 && selected.has(end + 1)) end += 1
    groups.push({ start: month, end })
  }

  if (groups.length > 1 && groups[0]?.start === 1 && groups.at(-1)?.end === 12) {
    const first = groups.shift()
    const last = groups.pop()
    if (first && last) groups.unshift({ start: last.start, end: first.end })
  }

  return groups
    .map(({ start, end }) => formatMonthRange(labels, start, end))
    .filter((range): range is string => Boolean(range))
    .join(', ')
}

function formatMonthRange(labels: Map<number, string>, start: number, end: number) {
  const startLabel = labels.get(start)
  const endLabel = labels.get(end)
  if (!startLabel) return undefined
  return startLabel === endLabel || !endLabel ? startLabel : `${startLabel}-${endLabel}`
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
