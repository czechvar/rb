import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocationBySlug, getPublishedEventsForLocation } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { mediaUrl, mediaAlt } from '@/lib/media'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { locationDetailGraphJsonLd } from '@/lib/jsonld'
import blockStyles from '@/components/blocks/blocks.module.css'
import styles from '../destinations.module.css'

type Props = { params: Promise<{ slug: string }> }
type LocationDetailPageData = NonNullable<Awaited<ReturnType<typeof getLocationBySlug>>>
type DestinationDetailData = NonNullable<LocationDetailPageData['destinationDetail']>
type SynthesizedBlock = {
  blockType: string
  [key: string]: unknown
}
type DestinationBlockGroups = {
  top: SynthesizedBlock[]
  main: SynthesizedBlock[]
  aside: SynthesizedBlock[]
  after: SynthesizedBlock[]
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: `${slug.replace(/-/g, ' ')} — Rockbusters Destinations` }
}

function osmEmbedSrc(lng: number, lat: number) {
  const bbox = [lng - 0.05, lat - 0.03, lng + 0.05, lat + 0.03].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params

  const loc = await getLocationBySlug(slug)
  if (!loc) notFound()

  const events = await getPublishedEventsForLocation(loc.id)
  const jsonLd = locationDetailGraphJsonLd(loc, events)
  const defaultDestinationBlocks = destinationDetailBlockGroups(loc)

  if (loc.layout?.length) {
    return (
      <MarketingShell
        crumbs={[
          { href: '/', label: 'Home' },
          { href: '/destinations', label: 'Destinations' },
          { label: loc.name },
        ]}
      >
        <JsonLd data={jsonLd} />
        <main>
          <RenderBlocks
            blocks={loc.layout}
            context={{ location: loc }}
          />
        </main>
      </MarketingShell>
    )
  }

  if (
    defaultDestinationBlocks.top.length ||
    defaultDestinationBlocks.main.length ||
    defaultDestinationBlocks.aside.length ||
    defaultDestinationBlocks.after.length
  ) {
    return (
      <MarketingShell>
        <JsonLd data={jsonLd} />
        <main>
          <RenderBlocks blocks={defaultDestinationBlocks.top} context={{ location: loc }} />
          <section className={blockStyles.destinationContentBand}>
            <div className={blockStyles.destinationContentShell}>
              <div className={blockStyles.destinationContentMain}>
                <RenderBlocks blocks={defaultDestinationBlocks.main} context={{ location: loc }} />
              </div>
              <aside className={blockStyles.destinationContentAside}>
                <RenderBlocks blocks={defaultDestinationBlocks.aside} context={{ location: loc }} />
              </aside>
            </div>
          </section>
          <RenderBlocks blocks={defaultDestinationBlocks.after} context={{ location: loc }} />
        </main>
      </MarketingShell>
    )
  }

  const hero = mediaUrl(loc.mainPicture)
  const [lng, lat] = loc.coordinates ?? [null, null]
  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/destinations', label: 'Destinations' },
        { label: loc.name },
      ]}
    >
      <JsonLd data={jsonLd} />
      <main className={styles.wrap}>
        <div className={styles.detailHeader}>
          <h1>{loc.name}</h1>
          {loc.country ? <p className={styles.countryLine}>{loc.country}</p> : null}
        </div>
        {hero ? (
          <Image
            src={hero}
            alt={mediaAlt(loc.mainPicture)}
            width={1080}
            height={540}
            className={styles.heroPhoto}
          />
        ) : null}
        {typeof lng === 'number' && typeof lat === 'number' ? (
          <div className={styles.map}>
            <iframe
              src={osmEmbedSrc(lng, lat)}
              title={`Map of ${loc.name}`}
              loading="lazy"
            />
          </div>
        ) : null}

        <section>
          <h2>Trips in {loc.name}</h2>
          {events.length ? (
            <ul className={styles.tripList}>
              {events.map((e) => (
                <li key={e.id}>
                  <Link href={`/trips/${e.slug}`}>{e.title}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No trips scheduled here right now — see the calendar for what&apos;s next.</p>
          )}
        </section>
      </main>
    </MarketingShell>
  )
}

function destinationDetailBlockGroups(loc: LocationDetailPageData): DestinationBlockGroups {
  const detail = loc.destinationDetail
  const empty = { top: [], main: [], aside: [], after: [] }
  if (!detail?.hero?.heading) return empty

  const sectionKeys = (keys: string[]) => keys.map((key) => ({ key }))
  const top: SynthesizedBlock[] = [
    { blockType: 'destinationHero' },
    { blockType: 'gallery', source: 'manual', variant: 'tiles', images: destinationGalleryImages(loc) },
  ]
  const main: SynthesizedBlock[] = [
    {
      blockType: 'destinationSections',
      sectionKeys: sectionKeys(['intro']),
    },
    {
      blockType: 'destinationSections',
      sectionKeys: sectionKeys(['history']),
    },
    {
      blockType: 'destinationSections',
      sectionKeys: sectionKeys(['rock']),
    },
    {
      blockType: 'destinationCardGrid',
      eyebrow: 'Suitability',
      heading: 'Who is it for?',
      source: 'audience',
      columns: '2',
    },
    {
      blockType: 'destinationSections',
      eyebrow: 'Problems & areas',
      heading: 'Grades',
      sectionKeys: sectionKeys(['grades']),
    },
    {
      blockType: 'destinationCardGrid',
      eyebrow: 'Problems & areas',
      heading: 'Key sectors',
      source: 'sectors',
      columns: '2',
    },
    {
      blockType: 'destinationSeason',
      eyebrow: 'Conditions',
      heading: 'Best season',
      intro: sectionBody(detail.sections, 'season'),
    },
    {
      blockType: 'destinationLogistics',
      eyebrow: 'Equipment',
      heading: 'What gear to bring',
      source: 'gearGroups',
      intro: sectionBody(detail.sections, 'gear'),
    },
    {
      blockType: 'destinationLogistics',
      eyebrow: 'Travel',
      heading: 'Getting there',
      source: 'transportOptions',
      intro: sectionBody(detail.sections, 'transport'),
    },
    {
      blockType: 'destinationLogistics',
      eyebrow: 'Accommodation & food',
      heading: 'Stay & eat',
      source: 'accommodationOptions',
      intro: sectionBody(detail.sections, 'stay'),
    },
    {
      blockType: 'destinationCardGrid',
      eyebrow: 'Beyond climbing',
      heading: 'Rest days',
      source: 'restDayIdeas',
      columns: '3',
      intro: sectionBody(detail.sections, 'restdays'),
    },
    {
      blockType: 'destinationCardGrid',
      eyebrow: 'Responsible climbing',
      heading: 'Tips & ethics',
      source: 'accessRules',
      columns: '3',
    },
    {
      blockType: 'destinationCardGrid',
      eyebrow: 'Emergency information',
      heading: 'Safety & emergency',
      source: 'safetyItems',
      columns: '2',
      intro: sectionBody(detail.sections, 'safety'),
    },
    {
      blockType: 'destinationLogistics',
      eyebrow: 'Budget planning',
      heading: 'Costs & budget',
      source: 'costItems',
      intro: sectionBody(detail.sections, 'costs'),
    },
    {
      blockType: 'destinationCardGrid',
      eyebrow: 'Questions',
      heading: 'Frequently asked questions',
      source: 'destinationFaqs',
      columns: '2',
    },
    {
      blockType: 'destinationCardGrid',
      eyebrow: 'Guided trips',
      heading: `Rockbusters trips to ${loc.name}`,
      source: 'tripPromos',
      columns: '2',
    },
    {
      blockType: 'destinationCardGrid',
      eyebrow: 'Other destinations',
      heading: 'Related destinations',
      source: detail.relatedLocations?.length ? 'relatedLocations' : 'relatedDestinationCards',
      columns: '3',
    },
  ]
  const aside: SynthesizedBlock[] = [{ blockType: 'destinationSidebar' }]
  const after: SynthesizedBlock[] = []

  if (detail.cta?.heading) {
    after.push({
      blockType: 'cta',
      variant: 'finalRed',
      eyebrow: detail.cta.eyebrow ?? `Rockbusters ${loc.name}`,
      heading: detail.cta.heading,
      body: detail.cta.body ?? undefined,
      primaryAction: detail.cta.primaryAction ?? undefined,
      secondaryAction: detail.cta.secondaryAction ?? undefined,
    })
  }

  return { top, main, aside, after }
}

function sectionBody(
  sections: DestinationDetailData['sections'] | null | undefined,
  key: string,
) {
  return sections?.find((section) => section.key === key)?.body ?? undefined
}

function destinationGalleryImages(loc: LocationDetailPageData) {
  const seen = new Set<string>()
  const mainPictureUrl = mediaUrl(loc.mainPicture)
  if (mainPictureUrl) seen.add(mainPictureUrl)
  const matchTerms = [loc.name, loc.slug, loc.city, loc.country]
    .map(normalizeMediaSearch)
    .filter(Boolean)
  const destinationMedia = (loc.gallery ?? []).filter((image) => {
    const url = mediaUrl(image)
    if (!url || seen.has(url)) return false
    seen.add(url)
    if (typeof image !== 'object' || !image) return false
    const label = normalizeMediaSearch(`${image.filename ?? ''} ${image.alt ?? ''}`)
    return matchTerms.some((term) => term && label.includes(term))
  })

  const preferredImages = [
    ...destinationMedia.filter(isCuratedWebImage),
    ...destinationMedia.filter((image) => !isCuratedWebImage(image)),
  ]

  return [loc.mainPicture, ...preferredImages].filter((image) => mediaUrl(image)).slice(0, 4)
}

function isCuratedWebImage(image: NonNullable<LocationDetailPageData['gallery']>[number]) {
  if (typeof image !== 'object' || !image) return false
  const width = image.width ?? 0
  const height = image.height ?? 0
  return width > 0 && height > 0 && Math.max(width, height) <= 1800
}

function normalizeMediaSearch(value: string | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}
