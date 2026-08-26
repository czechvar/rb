import { HeroBlockConfig } from './Hero/config'
import { SectionIntroBlockConfig } from './SectionIntro/config'
import { RichTextBlockConfig } from './RichText/config'
import { StatsBlockConfig } from './Stats/config'
import { CTABlockConfig } from './CTA/config'
import { TripGridBlockConfig } from './TripGrid/config'
import { ProgramGridBlockConfig } from './ProgramGrid/config'
import { LocationGridBlockConfig } from './LocationGrid/config'
import { GuideGridBlockConfig } from './GuideGrid/config'
import { PostGridBlockConfig } from './PostGrid/config'
import { CalendarBlockConfig } from './Calendar/config'
import { MediaBlockConfig } from './Media/config'
import { GalleryBlockConfig } from './Gallery/config'
import { VideoBlockConfig } from './Video/config'
import { FAQBlockConfig } from './FAQ/config'
import { ReviewGridBlockConfig } from './ReviewGrid/config'
import { PartnerStripBlockConfig } from './PartnerStrip/config'
import { GuideProfileBlockConfig } from './GuideProfile/config'
import { GuideTripsBlockConfig } from './GuideTrips/config'
import { TripHeroBlockConfig } from './TripHero/config'
import { TripPitchBlockConfig } from './TripPitch/config'
import { TripHighlightsBlockConfig } from './TripHighlights/config'
import { TripDatesBlockConfig } from './TripDates/config'
import { TripBookingCTABlockConfig } from './TripBookingCTA/config'
import { TripLogisticsBlockConfig } from './TripLogistics/config'
import { ProgramHeroBlockConfig } from './ProgramHero/config'
import { ProgramHighlightsBlockConfig } from './ProgramHighlights/config'
import { ProgramAudienceBlockConfig } from './ProgramAudience/config'
import { ProgramCurriculumBlockConfig } from './ProgramCurriculum/config'
import { ProgramFlowBlockConfig } from './ProgramFlow/config'
import { ProgramWeeksBlockConfig } from './ProgramWeeks/config'
import { ProgramLogisticsBlockConfig } from './ProgramLogistics/config'
import { ProgramCoachesBlockConfig } from './ProgramCoaches/config'
import { ProgramResultsBlockConfig } from './ProgramResults/config'
import { ProgramTripsBlockConfig } from './ProgramTrips/config'
import { ProgramCTABlockConfig } from './ProgramCTA/config'
import { LocationHeroBlockConfig } from './LocationHero/config'
import { LocationContentBlockConfig } from './LocationContent/config'
import { LocationMapBlockConfig } from './LocationMap/config'
import { LocationTripsBlockConfig } from './LocationTrips/config'
import { GuideHeroBlockConfig } from './GuideHero/config'
import { GuideStatsBlockConfig } from './GuideStats/config'
import { GuideAboutBlockConfig } from './GuideAbout/config'
import { GuideVideoBlockConfig } from './GuideVideo/config'
import { GuidePillarsBlockConfig } from './GuidePillars/config'
import { GuideTripsSectionBlockConfig } from './GuideTripsSection/config'
import { GuideAchievementsBlockConfig } from './GuideAchievements/config'
import { GuideTestimonialBlockConfig } from './GuideTestimonial/config'
import { GuideCTABlockConfig } from './GuideCTA/config'
import { PostHeroBlockConfig } from './PostHero/config'
import { PostBodyBlockConfig } from './PostBody/config'
import { RelatedPostsBlockConfig } from './RelatedPosts/config'
import { PostCTABlockConfig } from './PostCTA/config'
import type { Block } from 'payload'

export type BlockSurface = 'page' | 'event' | 'program' | 'location' | 'guide' | 'post'

export type BlockCategory =
  | 'content'
  | 'conversion'
  | 'catalogue'
  | 'media'
  | 'socialProof'
  | 'tripDetail'
  | 'programDetail'
  | 'locationDetail'
  | 'guideDetail'
  | 'postDetail'

export type BlockDataDependency = 'event' | 'program' | 'location' | 'guide' | 'post'
export type BlockSourceMode = 'currentContext' | 'manualSelection' | 'configuredContent'

export type BlockCatalogueEntry = {
  config: Block
  category: BlockCategory
  dataDependencies?: readonly BlockDataDependency[]
  sourceModes?: readonly BlockSourceMode[]
  compatibleWith?: '*' | readonly BlockSurface[]
  notCompatibleWith?: readonly BlockSurface[]
}

const allNonEventSurfaces = ['page', 'program', 'location', 'guide', 'post'] as const
const allNonProgramSurfaces = ['page', 'event', 'location', 'guide', 'post'] as const
const allNonLocationSurfaces = ['page', 'event', 'program', 'guide', 'post'] as const
const allNonGuideSurfaces = ['page', 'event', 'program', 'location', 'post'] as const
const allNonPostSurfaces = ['page', 'event', 'program', 'location', 'guide'] as const

export const blockCatalogue = [
  { config: HeroBlockConfig, category: 'content' },
  { config: SectionIntroBlockConfig, category: 'content' },
  { config: RichTextBlockConfig, category: 'content' },
  { config: StatsBlockConfig, category: 'content' },
  { config: CTABlockConfig, category: 'conversion' },
  { config: TripGridBlockConfig, category: 'catalogue' },
  { config: ProgramGridBlockConfig, category: 'catalogue' },
  { config: LocationGridBlockConfig, category: 'catalogue' },
  { config: GuideGridBlockConfig, category: 'catalogue' },
  { config: PostGridBlockConfig, category: 'catalogue' },
  { config: CalendarBlockConfig, category: 'catalogue' },
  { config: MediaBlockConfig, category: 'media' },
  { config: GalleryBlockConfig, category: 'media' },
  { config: VideoBlockConfig, category: 'media' },
  { config: FAQBlockConfig, category: 'socialProof' },
  { config: ReviewGridBlockConfig, category: 'socialProof' },
  { config: PartnerStripBlockConfig, category: 'socialProof' },
  { config: GuideProfileBlockConfig, category: 'socialProof' },
  {
    config: GuideTripsBlockConfig,
    category: 'socialProof',
    dataDependencies: ['guide'],
    sourceModes: ['currentContext', 'manualSelection'],
  },
  {
    config: TripHeroBlockConfig,
    category: 'tripDetail',
    dataDependencies: ['event'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonEventSurfaces,
  },
  {
    config: TripPitchBlockConfig,
    category: 'tripDetail',
    dataDependencies: ['event'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonEventSurfaces,
  },
  {
    config: TripHighlightsBlockConfig,
    category: 'tripDetail',
    dataDependencies: ['event'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonEventSurfaces,
  },
  {
    config: TripDatesBlockConfig,
    category: 'tripDetail',
    dataDependencies: ['event'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonEventSurfaces,
  },
  {
    config: TripBookingCTABlockConfig,
    category: 'tripDetail',
    dataDependencies: ['event'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonEventSurfaces,
  },
  {
    config: TripLogisticsBlockConfig,
    category: 'tripDetail',
    dataDependencies: ['event'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonEventSurfaces,
  },
  {
    config: ProgramHeroBlockConfig,
    category: 'programDetail',
    dataDependencies: ['program'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonProgramSurfaces,
  },
  {
    config: ProgramHighlightsBlockConfig,
    category: 'programDetail',
    dataDependencies: ['program'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonProgramSurfaces,
  },
  {
    config: ProgramAudienceBlockConfig,
    category: 'programDetail',
    dataDependencies: ['program'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonProgramSurfaces,
  },
  {
    config: ProgramCurriculumBlockConfig,
    category: 'programDetail',
    dataDependencies: ['program'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonProgramSurfaces,
  },
  {
    config: ProgramFlowBlockConfig,
    category: 'programDetail',
    dataDependencies: ['program'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonProgramSurfaces,
  },
  {
    config: ProgramWeeksBlockConfig,
    category: 'programDetail',
    dataDependencies: ['program'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonProgramSurfaces,
  },
  {
    config: ProgramLogisticsBlockConfig,
    category: 'programDetail',
    dataDependencies: ['program'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonProgramSurfaces,
  },
  {
    config: ProgramCoachesBlockConfig,
    category: 'programDetail',
    dataDependencies: ['program'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonProgramSurfaces,
  },
  {
    config: ProgramResultsBlockConfig,
    category: 'programDetail',
    dataDependencies: ['program'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonProgramSurfaces,
  },
  {
    config: ProgramTripsBlockConfig,
    category: 'programDetail',
    dataDependencies: ['program'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonProgramSurfaces,
  },
  {
    config: ProgramCTABlockConfig,
    category: 'programDetail',
    dataDependencies: ['program'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonProgramSurfaces,
  },
  {
    config: LocationHeroBlockConfig,
    category: 'locationDetail',
    dataDependencies: ['location'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonLocationSurfaces,
  },
  {
    config: LocationContentBlockConfig,
    category: 'locationDetail',
    dataDependencies: ['location'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonLocationSurfaces,
  },
  {
    config: LocationMapBlockConfig,
    category: 'locationDetail',
    dataDependencies: ['location'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonLocationSurfaces,
  },
  {
    config: LocationTripsBlockConfig,
    category: 'locationDetail',
    dataDependencies: ['location'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonLocationSurfaces,
  },
  {
    config: GuideHeroBlockConfig,
    category: 'guideDetail',
    dataDependencies: ['guide'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonGuideSurfaces,
  },
  {
    config: GuideStatsBlockConfig,
    category: 'guideDetail',
    dataDependencies: ['guide'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonGuideSurfaces,
  },
  {
    config: GuideAboutBlockConfig,
    category: 'guideDetail',
    dataDependencies: ['guide'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonGuideSurfaces,
  },
  {
    config: GuideVideoBlockConfig,
    category: 'guideDetail',
    dataDependencies: ['guide'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonGuideSurfaces,
  },
  {
    config: GuidePillarsBlockConfig,
    category: 'guideDetail',
    dataDependencies: ['guide'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonGuideSurfaces,
  },
  {
    config: GuideTripsSectionBlockConfig,
    category: 'guideDetail',
    dataDependencies: ['guide'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonGuideSurfaces,
  },
  {
    config: GuideAchievementsBlockConfig,
    category: 'guideDetail',
    dataDependencies: ['guide'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonGuideSurfaces,
  },
  {
    config: GuideTestimonialBlockConfig,
    category: 'guideDetail',
    dataDependencies: ['guide'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonGuideSurfaces,
  },
  {
    config: GuideCTABlockConfig,
    category: 'guideDetail',
    dataDependencies: ['guide'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonGuideSurfaces,
  },
  {
    config: PostHeroBlockConfig,
    category: 'postDetail',
    dataDependencies: ['post'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonPostSurfaces,
  },
  {
    config: PostBodyBlockConfig,
    category: 'postDetail',
    dataDependencies: ['post'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonPostSurfaces,
  },
  {
    config: RelatedPostsBlockConfig,
    category: 'postDetail',
    dataDependencies: ['post'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonPostSurfaces,
  },
  {
    config: PostCTABlockConfig,
    category: 'postDetail',
    dataDependencies: ['post'],
    sourceModes: ['currentContext'],
    notCompatibleWith: allNonPostSurfaces,
  },
] satisfies readonly BlockCatalogueEntry[]

export function isBlockCompatibleWithSurface(
  entry: BlockCatalogueEntry,
  surface: BlockSurface,
): boolean {
  const compatibleWith = entry.compatibleWith ?? '*'
  const compatible =
    compatibleWith === '*' || compatibleWith.includes(surface)

  return compatible && !entry.notCompatibleWith?.includes(surface)
}

export function blocksFor(surface: BlockSurface): Block[] {
  return blockCatalogue
    .filter((entry) => isBlockCompatibleWithSurface(entry, surface))
    .map((entry) => entry.config)
}

function blocksInCategory(category: BlockCategory): Block[] {
  return blockCatalogue
    .filter((entry) => entry.category === category)
    .map((entry) => entry.config)
}

export const contentBlocks = blocksInCategory('content')
export const conversionBlocks = blocksInCategory('conversion')
export const catalogueBlocks = blocksInCategory('catalogue')
export const mediaBlocks = blocksInCategory('media')
export const socialProofBlocks = blocksInCategory('socialProof')
export const tripDetailBlocks = blocksInCategory('tripDetail')
export const programDetailBlocks = blocksInCategory('programDetail')
export const locationDetailBlocks = blocksInCategory('locationDetail')
export const guideDetailBlocks = blocksInCategory('guideDetail')
export const postDetailBlocks = blocksInCategory('postDetail')

export const pageBlocks = blocksFor('page')
export const eventLayoutBlocks = blocksFor('event')
export const programLayoutBlocks = blocksFor('program')
export const locationLayoutBlocks = blocksFor('location')
export const guideLayoutBlocks = blocksFor('guide')
export const postLayoutBlocks = blocksFor('post')
