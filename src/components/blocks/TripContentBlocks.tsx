import { resolveTripDetail } from '@/lib/trip-detail'
import { Lexical } from '@/lib/lexical'
import { TripEditorialSection } from '@/components/sections/TripEditorialSection'
import { AudienceCards } from '@/components/sections/AudienceCards'
import { WhatYouLearn } from '@/components/sections/WhatYouLearn'
import { TripProgrammeComparison } from '@/components/sections/TripComparison'
import { DayByDayItinerary } from '@/components/sections/DayByDayItinerary'
import { EssentialEquipment } from '@/components/sections/EssentialEquipment'
import { Prerequisites } from '@/components/sections/Prerequisites'
import { HighlightsGrid } from '@/components/sections/HighlightsGrid'
import { LocationBlock } from '@/components/sections/LocationBlock'
import { CoachesMinimal } from '@/components/sections/CoachesMinimal'
import { PartnerBlock } from '@/components/sections/PartnerBlock'
import { DemoLessonBlock } from '@/components/sections/DemoLessonBlock'
import { StatsBlock } from './StatsBlock'
import { BlockHeader, GuideCard } from './CatalogueCards'
import catalogueStyles from './blocks.module.css'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './TripContentBlocks.module.css'

type Options = { [key: string]: unknown }
function view(context: BlockRenderContext) {
  return context.trip ?? (context.event ? resolveTripDetail(context.event, []) : null)
}

export function TripContentBlock(block: Options, context: BlockRenderContext) {
  const trip = view(context)
  if (!trip) return null
  const eyebrow = typeof block.eyebrow === 'string' ? block.eyebrow : undefined
  const kind = typeof block.section === 'string' ? block.section : 'overview'
  if (kind === 'remaining') {
    const event = trip.event
    return (
      <>
      {(trip.remainingContent || !!trip.remainingAdditionalInfo?.length) && <section className={styles.remaining}>
        {eyebrow && <p data-eyebrow="section" className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.remainingHeading}>More about this trip</h2>
          <div className={styles.prose}>
            <Lexical data={trip.remainingContent} />
            {trip.remainingAdditionalInfo?.map((info, index) => (
              <div key={info.id ?? index}><h3>{info.heading}</h3><Lexical data={info.body} /></div>
            ))}
          </div>
      </section>}
      <PartnerBlock partner={event.partner} eyebrow={event.partnerEyebrow} headline={event.partnerHeadline} description={event.partnerDescription} benefits={event.partnerBenefits} />
      <DemoLessonBlock event={event} />
      </>
    )
  }
  const sections = trip.sections.filter(section => section.kind === kind)
  const existingContent = (() => {
    const event = trip.event
    if (kind === 'audience') return <AudienceCards eyebrow={eyebrow} headingVariant="embedded" cards={event.audienceCards} />
    if (kind === 'learning') return <WhatYouLearn variant={block.variant === 'cards' ? 'pillars' : undefined} eyebrow={eyebrow} headingVariant="embedded" data={event.whatYouLearn} />
    if (kind === 'itinerary') return <DayByDayItinerary eyebrow={eyebrow} headingVariant="embedded" data={event.itinerary} />
    if (kind === 'equipment') return <EssentialEquipment eyebrow={eyebrow} headingVariant="embedded" items={event.essentialEquipment} intro={event.equipmentIntro} />
    if (kind === 'requirements') return <Prerequisites eyebrow={eyebrow} headingVariant="embedded" items={event.prerequisites} />
    if (kind === 'highlights') return <HighlightsGrid eyebrow={eyebrow} headingVariant="embedded" items={event.highlights} heading="Trip Highlights" />
    return null
  })()
  if (!sections.length) return kind === 'itinerary' && block.variant === 'timeline' ? <TripProgrammeComparison programme={trip.event.itinerary?.days?.length ? existingContent : null} comparison={trip.event.comparison} /> : existingContent
  const variant = block.variant === 'cards' || block.variant === 'timeline' ? block.variant : 'prose'
  if (block.variant === 'overview') {
    return (
      <div id="overview" className={styles.overview}>
        <div>{existingContent}{sections.map(section => <TripEditorialSection key={section.id ?? section.heading} section={section} eyebrow={eyebrow} tone="bright" />)}<a className={`btn-primary ${styles.overviewAction}`} href={trip.bookingHref ?? 'mailto:info@rockbusters.net'}>{trip.bookingHref ? 'Book Your Spot' : 'Ask a Question'}</a></div>
        {trip.facts.length > 0 && <dl className={styles.facts}>
          {[...trip.facts, ...(trip.priceLabel ? [{ label: 'Price per person', value: trip.priceLabel }] : [])].map(fact => (
            <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
          ))}
        </dl>}
      </div>
    )
  }
  const content = <>{existingContent}{sections.map((section, index) => <TripEditorialSection key={section.id ?? `${kind}-${index}`} section={section} eyebrow={eyebrow} variant={variant} id={index === 0 ? kind : `${kind}-${index}`} />)}</>
  return kind === 'itinerary' && block.variant === 'timeline' ? <TripProgrammeComparison programme={content} comparison={trip.event.comparison} /> : content
}

export function TripFactsBlock(block: Options, context: BlockRenderContext) {
  const trip = view(context)
  if (!trip) return null
  const items = [...trip.facts, ...(trip.priceLabel ? [{ label: 'Price per person', value: trip.priceLabel }] : [])]
  if (!items.length) return null
  return <StatsBlock blockType="stats" columns="auto" variant={block.variant === 'grid' ? 'dark' : 'heroBar'} items={items} />
}

export function TripVenueBlock(block: Options, context: BlockRenderContext) {
  const trip = view(context)
  if (!trip?.locations.length) return null
  return <div id="venue">{trip.locations.map(location => {
    const intro = location.destinationDetail?.sections?.find(section => section.key === 'intro')?.body
    if (!intro) return null
    const facts = [
      ...(location.country ? [{ label: 'Country', value: location.country }] : []),
      ...(location.gradeRange ? [{ label: 'Grade range', value: location.gradeRange }] : []),
    ]
    return <LocationBlock key={location.id} heading={location.name} body={intro} image={location.mainPicture}
      eyebrow="The Venue" variant={block.variant === 'editorial' ? 'editorial' : undefined} facts={facts} />
  })}</div>
}

export function TripTeamBlock(block: Options, context: BlockRenderContext) {
  const trip = view(context)
  if (!trip || (!trip.guides.length && !trip.event.coachTeamBullets?.length)) return null
  if (block.variant !== 'cards') {
    return <div id="team"><CoachesMinimal coaches={trip.guides} framing={trip.event.coachFramingParagraph}
      teamBullets={trip.event.coachTeamBullets} /></div>
  }
  return (
    <section id="team" className={`${catalogueStyles.domainGridSection} ${catalogueStyles.guidePhotoSection}`}>
      <div className={catalogueStyles.sectionInner}>
        <BlockHeader eyebrow={typeof block.eyebrow === 'string' ? block.eyebrow : undefined} heading="Meet your guides" intro={trip.event.coachFramingParagraph} />
        {trip.guides.length > 0 && <div className={`${catalogueStyles.domainGrid} ${catalogueStyles.guidePhotoGrid}`}>
          {trip.guides.map(guide => <GuideCard key={guide.id} guide={guide} variant="photoOverlay" />)}
        </div>}
        {!!trip.event.coachTeamBullets?.length && <div className={catalogueStyles.richTextBody}>
          <ul>{trip.event.coachTeamBullets.map((bullet, index) => <li key={bullet.id ?? index}>{bullet.text}</li>)}</ul>
        </div>}
      </div>
    </section>
  )
}
