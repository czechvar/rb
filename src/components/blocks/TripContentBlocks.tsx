import { tripCopy } from './trip-copy'
import { headingText, type TripSectionKey } from '@/lib/trip-editorial'
import { SectionIntro } from '@/components/sections/SectionIntro'
import { tripSummary, tripCommercialText } from '@/lib/trip-summary'
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
import { GuideCard } from './CatalogueCards'
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
  const kind = typeof block.section === 'string' ? block.section : 'overview'
  const copy = tripCopy(trip, kind as TripSectionKey, block)
  const { eyebrow, heading, intro } = copy
  if (copy.hide && kind !== 'itinerary') return null
  if (kind === 'remaining') {
    const event = trip.event
    return (
      <>
        {(trip.remainingContent || !!trip.remainingAdditionalInfo?.length) && (
          <section className={styles.remaining}>
            {eyebrow && (
              <p data-eyebrow="section" className={styles.eyebrow}>
                {eyebrow}
              </p>
            )}
            <h2 className={styles.remainingHeading}>More about this trip</h2>
            <div className={styles.prose}>
              <Lexical data={trip.remainingContent} />
              {trip.remainingAdditionalInfo?.map((info, index) => (
                <div key={info.id ?? index}>
                  <h3>{info.heading}</h3>
                  <Lexical data={info.body} />
                </div>
              ))}
            </div>
          </section>
        )}
        <PartnerBlock
          partner={event.partner}
          eyebrow={event.partnerEyebrow}
          headline={event.partnerHeadline}
          description={event.partnerDescription}
          benefits={event.partnerBenefits}
        />
        <DemoLessonBlock event={event} />
      </>
    )
  }
  const sections = trip.sections.filter((section) => section.kind === kind)
  const comparisonCopy = tripCopy(
    trip,
    'comparison',
    {},
    {
      heading: trip.event.comparison?.heading,
      intro: trip.event.comparison?.intro,
      eyebrow: "What's Different",
    },
  )
  const comparison = comparisonCopy.hide
    ? undefined
    : trip.event.comparison
      ? {
          ...trip.event.comparison,
          leftHeading: tripCommercialText(trip, trip.event.comparison.leftHeading),
          rightHeading: tripCommercialText(trip, trip.event.comparison.rightHeading),
        }
      : undefined
  const pairProgramme = (programme: React.ReactNode) => (
    <TripProgrammeComparison
      programme={programme}
      companion={comparisonCopy.hide ? undefined : trip.editorial?.companion}
      text={(value) => tripCommercialText(trip, value)}
      comparison={
        comparison
          ? {
              ...comparison,
              heading:
                headingText(comparisonCopy.headingParts) ||
                (typeof comparisonCopy.heading === 'string'
                  ? comparisonCopy.heading
                  : comparison.heading),
            }
          : undefined
      }
      heading={comparisonCopy.heading}
      eyebrow={comparisonCopy.eyebrow}
      intro={comparisonCopy.intro}
    />
  )
  if (copy.hide) return pairProgramme(null)
  const schedule = trip.editorial?.dailySchedule?.filter(
    (row) => row.time || row.title || row.description,
  )
  if (kind === 'itinerary' && schedule?.length)
    return pairProgramme(
      <section id="itinerary" className={styles.dailySchedule}>
        <SectionIntro
          variant="embedded"
          title={heading ?? 'A Typical Day'}
          eyebrow={eyebrow}
          lead={intro}
          align="left"
        />
        <dl>
          {schedule.map((row, index) => (
            <div key={index}>
              <dt>{row.time}</dt>
              <dd>
                <strong>{row.title}</strong>
                {row.description && <p>{row.description}</p>}
              </dd>
            </div>
          ))}
        </dl>
      </section>,
    )
  const existingContent = (() => {
    const event = trip.event
    if (kind === 'audience')
      return (
        <AudienceCards
          heading={heading}
          intro={intro}
          eyebrow={eyebrow}
          headingVariant="embedded"
          cards={event.audienceCards}
        />
      )
    if (kind === 'learning')
      return (
        <WhatYouLearn
          heading={heading}
          intro={intro}
          variant={block.variant === 'cards' ? 'pillars' : undefined}
          eyebrow={eyebrow}
          headingVariant="embedded"
          data={event.whatYouLearn}
        />
      )
    if (kind === 'itinerary')
      return (
        <DayByDayItinerary
          heading={heading}
          intro={intro}
          eyebrow={eyebrow}
          headingVariant="embedded"
          data={event.itinerary}
        />
      )
    if (kind === 'equipment')
      return (
        <EssentialEquipment
          eyebrow={eyebrow}
          headingVariant="embedded"
          items={event.essentialEquipment}
          intro={event.equipmentIntro}
        />
      )
    if (kind === 'requirements')
      return (
        <Prerequisites eyebrow={eyebrow} headingVariant="embedded" items={event.prerequisites} />
      )
    if (kind === 'highlights')
      return (
        <HighlightsGrid
          eyebrow={eyebrow}
          headingVariant="embedded"
          items={event.highlights}
          heading="Trip Highlights"
        />
      )
    return null
  })()
  if (!sections.length)
    return kind === 'itinerary' && block.variant === 'timeline'
      ? pairProgramme(trip.event.itinerary?.days?.length ? existingContent : null)
      : existingContent
  const variant =
    block.variant === 'cards' || block.variant === 'timeline' ? block.variant : 'prose'
  if (block.variant === 'overview') {
    return (
      <div id="overview" className={styles.overview}>
        <div>
          {existingContent}
          {sections.map((section) => (
            <TripEditorialSection
              key={section.id ?? section.heading}
              section={section}
              heading={heading}
              intro={intro}
              eyebrow={eyebrow}
              tone="bright"
            />
          ))}
          <a
            className={`btn-primary ${styles.overviewAction}`}
            href={trip.bookingHref ?? 'mailto:info@rockbusters.net'}
          >
            {trip.bookingHref
              ? tripCommercialText(
                  trip,
                  trip.editorial?.actions?.overviewLabel ?? trip.editorial?.booking?.primaryLabel,
                ) || 'Book Your Spot'
              : 'Ask a Question'}
          </a>
        </div>
        {(trip.editorial?.overviewFacts?.length || trip.facts.length > 0) && (
          <dl className={styles.facts}>
            {(trip.editorial?.overviewFacts?.length
              ? trip.editorial.overviewFacts
              : [
                  ...trip.facts,
                  ...(trip.priceLabel
                    ? [{ label: 'Price per person', value: trip.priceLabel }]
                    : []),
                ]
            ).map((fact, index) => (
              <div key={index}>
                <dt>{fact.label}</dt>
                <dd>{tripCommercialText(trip, fact.value)}</dd>
                {'description' in fact && fact.description && (
                  <p>{tripCommercialText(trip, fact.description as string)}</p>
                )}
              </div>
            ))}
          </dl>
        )}
      </div>
    )
  }
  const content = (
    <>
      {existingContent}
      {sections.map((section, index) => (
        <TripEditorialSection
          key={section.id ?? `${kind}-${index}`}
          section={section}
          heading={heading}
          intro={intro}
          eyebrow={eyebrow}
          variant={variant}
          id={index === 0 ? kind : `${kind}-${index}`}
        />
      ))}
    </>
  )
  return kind === 'itinerary' && block.variant === 'timeline' ? pairProgramme(content) : content
}

export function TripFactsBlock(block: Options, context: BlockRenderContext) {
  const trip = view(context)
  if (!trip) return null
  const authored = trip.editorial?.factsStrip?.map((fact) => ({
    label: tripCommercialText(trip, fact.label) ?? '',
    value: tripCommercialText(trip, fact.value) ?? '',
  }))
  const items = authored?.length
    ? authored
    : (tripSummary(trip)?.strip ?? [
        ...trip.facts,
        ...(trip.priceLabel ? [{ label: 'Price per person', value: trip.priceLabel }] : []),
      ])
  if (!items.length) return null
  return (
    <StatsBlock
      blockType="stats"
      columns="auto"
      variant={block.variant === 'grid' ? 'dark' : 'heroBar'}
      items={items}
    />
  )
}

export function TripVenueBlock(block: Options, context: BlockRenderContext) {
  const trip = view(context)
  if (!trip?.locations.length) return null
  const copy = tripCopy(trip, 'venue', block, { eyebrow: 'The Venue' })
  if (copy.hide) return null
  const venue = trip.editorial?.venue
  if (venue?.paragraphs?.length)
    return (
      <div id="venue">
        <LocationBlock
          heading={copy.heading ?? trip.locations[0].name}
          eyebrow={copy.eyebrow}
          variant={block.variant === 'editorial' ? 'editorial' : undefined}
          image={trip.locations[0].mainPicture}
          body={[copy.intro, ...venue.paragraphs.map((row) => row.text ?? '')]
            .filter(Boolean)
            .join('\n\n')}
          facts={(venue.facts ?? []).map((fact) => ({
            label: fact.label ?? '',
            value: fact.value ?? '',
          }))}
        />
      </div>
    )
  return (
    <div id="venue">
      {trip.locations.map((location) => {
        const intro = location.destinationDetail?.sections?.find(
          (section) => section.key === 'intro',
        )?.body
        if (!intro) return null
        const facts = [
          ...(location.country ? [{ label: 'Country', value: location.country }] : []),
          ...(location.gradeRange ? [{ label: 'Grade range', value: location.gradeRange }] : []),
        ]
        return (
          <LocationBlock
            key={location.id}
            heading={copy.heading ?? location.name}
            body={[copy.intro, intro].filter(Boolean).join('\n\n')}
            image={location.mainPicture}
            eyebrow={copy.eyebrow}
            variant={block.variant === 'editorial' ? 'editorial' : undefined}
            facts={facts}
          />
        )
      })}
    </div>
  )
}

export function TripTeamBlock(block: Options, context: BlockRenderContext) {
  const trip = view(context)
  if (!trip || (!trip.guides.length && !trip.event.coachTeamBullets?.length)) return null
  const copy = tripCopy(trip, 'team', block, {
    heading: 'Meet your guides',
    intro: trip.event.coachFramingParagraph,
  })
  if (copy.hide) return null
  if (block.variant !== 'cards') {
    return (
      <div id="team">
        <CoachesMinimal
          heading={copy.heading}
          eyebrow={copy.eyebrow}
          coaches={trip.guides}
          framing={copy.intro}
          teamBullets={trip.event.coachTeamBullets}
        />
      </div>
    )
  }
  return (
    <section
      id="team"
      className={`${catalogueStyles.domainGridSection} ${catalogueStyles.guidePhotoSection}`}
    >
      <div className={catalogueStyles.sectionInner}>
        <div className={catalogueStyles.sectionHeader}>
          {copy.eyebrow && (
            <p data-eyebrow="section" className={catalogueStyles.eyebrow}>
              {copy.eyebrow}
            </p>
          )}
          {copy.heading && <h2>{copy.heading}</h2>}
          {copy.intro && <p>{copy.intro}</p>}
        </div>
        {trip.guides.length > 0 && (
          <div className={`${catalogueStyles.domainGrid} ${catalogueStyles.guidePhotoGrid}`}>
            {trip.guides.map((guide) => {
              const profile = trip.editorial?.coachProfiles?.find(
                (row) => (typeof row.guide === 'object' ? row.guide?.id : row.guide) === guide.id,
              )
              return (
                <div key={guide.id}>
                  <GuideCard guide={guide} variant="photoOverlay" />
                  {profile?.role && <p>{profile.role}</p>}
                  {profile?.bio && <p className={styles.profileBio}>{profile.bio}</p>}
                </div>
              )
            })}
          </div>
        )}
        {!!trip.event.coachTeamBullets?.length && (
          <div className={catalogueStyles.richTextBody}>
            <ul>
              {trip.event.coachTeamBullets.map((bullet, index) => (
                <li key={bullet.id ?? index}>{bullet.text}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
