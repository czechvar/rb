import React from 'react'
import type { Event, Guide, Location, Page, Post, Program } from '@/payload-types'
import { HeroBlock } from './HeroBlock'
import { SectionIntroBlock } from './SectionIntroBlock'
import { RichTextBlock } from './RichTextBlock'
import { StatsBlock } from './StatsBlock'
import { CTABlock } from './CTABlock'
import { TripGridBlock } from './TripGridBlock'
import { ProgramGridBlock } from './ProgramGridBlock'
import { LocationGridBlock } from './LocationGridBlock'
import { DestinationCountryIndexBlock } from './DestinationCountryIndexBlock'
import { GuideGridBlock } from './GuideGridBlock'
import { PostGridBlock } from './PostGridBlock'
import { CalendarBlock } from './CalendarBlock'
import {
  FeaturedEventDateBlock,
  FeaturedGuideBlock,
  FeaturedLocationBlock,
  FeaturedPostBlock,
  FeaturedProgramBlock,
  FeaturedTripBlock,
} from './FeaturedCatalogueBlocks'
import { MediaBlock } from './MediaBlock'
import { GalleryBlock } from './GalleryBlock'
import { VideoBlock } from './VideoBlock'
import { FAQBlock } from './FAQBlock'
import { ReviewGridBlock } from './ReviewGridBlock'
import { PartnerStripBlock } from './PartnerStripBlock'
import { GuideProfileBlock } from './GuideProfileBlock'
import { GuideTripsBlock } from './GuideTripsBlock'
import { TripHeroBlock } from './TripHeroBlock'
import { TripPitchContextBlock } from './TripPitchContextBlock'
import { TripHighlightsBlock } from './TripHighlightsBlock'
import { TripDatesBlock } from './TripDatesBlock'
import { TripBookingCTABlock } from './TripBookingCTABlock'
import { TripLogisticsBlock } from './TripLogisticsBlock'
import {
  ProgramAudienceBlock,
  ProgramCoachesBlock,
  ProgramCTABlock,
  ProgramCurriculumBlock,
  ProgramFlowBlock,
  ProgramHeroBlock,
  ProgramHighlightsBlock,
  ProgramLogisticsBlock,
  ProgramResultsBlock,
  ProgramTripsBlock,
  ProgramWeeksBlock,
} from './ProgramContextBlocks'
import {
  LocationContentBlock,
  LocationHeroBlock,
  LocationMapBlock,
  LocationTripsBlock,
} from './LocationContextBlocks'
import {
  GuideAboutBlock,
  GuideAchievementsBlock,
  GuideCTABlock,
  GuideHeroBlock,
  GuidePillarsBlock,
  GuideStatsBlock,
  GuideTestimonialBlock,
  GuideTripsSectionBlock,
  GuideVideoBlock,
} from './GuideContextBlocks'
import {
  PostBodyBlock,
  PostCTABlock,
  PostHeroBlock,
  RelatedPostsBlock,
} from './PostContextBlocks'

type PageBlock = NonNullable<Page['layout']>[number]
type RenderableBlock = PageBlock | {
  blockType: string
  id?: string | null
  [key: string]: unknown
}

export type BlockRenderContext = {
  page?: Pick<Page, 'id' | 'slug'> | null
  event?: Event | null
  program?: Program | null
  location?: Location | null
  guide?: Guide | null
  post?: Post | null
}

type BlockRenderer = (
  block: RenderableBlock,
  context: BlockRenderContext,
) => Promise<React.ReactNode> | React.ReactNode

const blockRenderers: Record<string, BlockRenderer> = {
  hero: (block) => <HeroBlock {...(block as Extract<PageBlock, { blockType: 'hero' }>)} />,
  'section-intro': (block) => (
    <SectionIntroBlock {...(block as Extract<PageBlock, { blockType: 'section-intro' }>)} />
  ),
  'rich-text': (block) => (
    <RichTextBlock {...(block as Extract<PageBlock, { blockType: 'rich-text' }>)} />
  ),
  stats: (block) => <StatsBlock {...(block as Extract<PageBlock, { blockType: 'stats' }>)} />,
  cta: (block) => <CTABlock {...(block as Extract<PageBlock, { blockType: 'cta' }>)} />,
  tripGrid: (block, context) =>
    TripGridBlock(block as Extract<PageBlock, { blockType: 'tripGrid' }>, context),
  featuredTrip: (block, context) =>
    FeaturedTripBlock(block as Extract<PageBlock, { blockType: 'featuredTrip' }>, context),
  programGrid: (block) =>
    ProgramGridBlock(block as Extract<PageBlock, { blockType: 'programGrid' }>),
  featuredProgram: (block, context) =>
    FeaturedProgramBlock(block as Extract<PageBlock, { blockType: 'featuredProgram' }>, context),
  locationGrid: (block) =>
    LocationGridBlock(block as Extract<PageBlock, { blockType: 'locationGrid' }>),
  destinationCountryIndex: (block) =>
    DestinationCountryIndexBlock(
      block as Extract<PageBlock, { blockType: 'destinationCountryIndex' }>,
    ),
  featuredLocation: (block, context) =>
    FeaturedLocationBlock(block as Extract<PageBlock, { blockType: 'featuredLocation' }>, context),
  guideGrid: (block) => GuideGridBlock(block as Extract<PageBlock, { blockType: 'guideGrid' }>),
  featuredGuide: (block, context) =>
    FeaturedGuideBlock(block as Extract<PageBlock, { blockType: 'featuredGuide' }>, context),
  postGrid: (block) => PostGridBlock(block as Extract<PageBlock, { blockType: 'postGrid' }>),
  featuredPost: (block, context) =>
    FeaturedPostBlock(block as Extract<PageBlock, { blockType: 'featuredPost' }>, context),
  calendar: (block, context) =>
    CalendarBlock(block as Extract<PageBlock, { blockType: 'calendar' }>, context),
  featuredEventDate: (block) =>
    FeaturedEventDateBlock(block as Extract<PageBlock, { blockType: 'featuredEventDate' }>),
  mediaBlock: (block) => <MediaBlock {...(block as Extract<PageBlock, { blockType: 'mediaBlock' }>)} />,
  gallery: (block, context) => (
    <GalleryBlock {...(block as Extract<PageBlock, { blockType: 'gallery' }>)} context={context} />
  ),
  video: (block) => <VideoBlock {...(block as Extract<PageBlock, { blockType: 'video' }>)} />,
  faq: (block, context) => FAQBlock(block as Extract<PageBlock, { blockType: 'faq' }>, context),
  reviewGrid: (block, context) =>
    ReviewGridBlock(block as Extract<PageBlock, { blockType: 'reviewGrid' }>, context),
  partnerStrip: (block) =>
    PartnerStripBlock(block as Extract<PageBlock, { blockType: 'partnerStrip' }>),
  guideProfile: (block, context) =>
    GuideProfileBlock(block as Extract<PageBlock, { blockType: 'guideProfile' }>, context),
  guideTrips: (block, context) =>
    GuideTripsBlock(block as Extract<PageBlock, { blockType: 'guideTrips' }>, context),
  tripHero: (_block, context) => <TripHeroBlock {...context} />,
  tripPitch: (_block, context) => <TripPitchContextBlock {...context} />,
  tripHighlights: (block, context) => TripHighlightsBlock(block, context),
  tripDates: (block, context) => TripDatesBlock(block, context),
  tripBookingCTA: (block, context) => TripBookingCTABlock(block, context),
  tripLogistics: (block, context) => TripLogisticsBlock(block, context),
  programHero: (block, context) => ProgramHeroBlock(block, context),
  programHighlights: (block, context) => ProgramHighlightsBlock(block, context),
  programAudience: (block, context) => ProgramAudienceBlock(block, context),
  programCurriculum: (block, context) => ProgramCurriculumBlock(block, context),
  programFlow: (block, context) => ProgramFlowBlock(block, context),
  programWeeks: (block, context) => ProgramWeeksBlock(block, context),
  programLogistics: (block, context) => ProgramLogisticsBlock(block, context),
  programCoaches: (block, context) => ProgramCoachesBlock(block, context),
  programResults: (block, context) => ProgramResultsBlock(block, context),
  programTrips: (block, context) => ProgramTripsBlock(block, context),
  programCTA: (block, context) => ProgramCTABlock(block, context),
  locationHero: (block, context) => LocationHeroBlock(block, context),
  locationContent: (block, context) => LocationContentBlock(block, context),
  locationMap: (block, context) => LocationMapBlock(block, context),
  locationTrips: (block, context) => LocationTripsBlock(block, context),
  guideHero: (block, context) => GuideHeroBlock(block, context),
  guideStats: (block, context) => GuideStatsBlock(block, context),
  guideAbout: (block, context) => GuideAboutBlock(block, context),
  guideVideo: (block, context) => GuideVideoBlock(block, context),
  guidePillars: (block, context) => GuidePillarsBlock(block, context),
  guideTripsSection: (block, context) => GuideTripsSectionBlock(block, context),
  guideAchievements: (block, context) => GuideAchievementsBlock(block, context),
  guideTestimonial: (block, context) => GuideTestimonialBlock(block, context),
  guideCTA: (block, context) => GuideCTABlock(block, context),
  postHero: (block, context) => PostHeroBlock(block, context),
  postBody: (block, context) => PostBodyBlock(block, context),
  relatedPosts: (block, context) => RelatedPostsBlock(block, context),
  postCTA: (block, context) => PostCTABlock(block, context),
}

async function renderBlock(block: RenderableBlock, index: number, context: BlockRenderContext) {
  const key = block.id ?? `${block.blockType}-${index}`
  const renderer = blockRenderers[block.blockType]
  if (!renderer) return null
  return <React.Fragment key={key}>{await renderer(block, context)}</React.Fragment>
}

export async function RenderBlocks({
  blocks,
  context = {},
}: {
  blocks?: RenderableBlock[] | Page['layout'] | null
  context?: BlockRenderContext
}) {
  if (!blocks?.length) return null
  return <>{await Promise.all(blocks.map((block, index) => renderBlock(block, index, context)))}</>
}
