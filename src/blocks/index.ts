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

export const contentBlocks = [
  HeroBlockConfig,
  SectionIntroBlockConfig,
  RichTextBlockConfig,
  StatsBlockConfig,
]
export const conversionBlocks = [CTABlockConfig]
export const catalogueBlocks = [
  TripGridBlockConfig,
  ProgramGridBlockConfig,
  LocationGridBlockConfig,
  GuideGridBlockConfig,
  PostGridBlockConfig,
  CalendarBlockConfig,
]
export const mediaBlocks = [MediaBlockConfig, GalleryBlockConfig, VideoBlockConfig]
export const socialProofBlocks = [
  FAQBlockConfig,
  ReviewGridBlockConfig,
  PartnerStripBlockConfig,
  GuideProfileBlockConfig,
  GuideTripsBlockConfig,
]
export const tripDetailBlocks = [
  TripHeroBlockConfig,
  TripPitchBlockConfig,
  TripHighlightsBlockConfig,
  TripDatesBlockConfig,
  TripBookingCTABlockConfig,
  TripLogisticsBlockConfig,
]
export const programDetailBlocks = [
  ProgramHeroBlockConfig,
  ProgramHighlightsBlockConfig,
  ProgramAudienceBlockConfig,
  ProgramCurriculumBlockConfig,
  ProgramFlowBlockConfig,
  ProgramWeeksBlockConfig,
  ProgramLogisticsBlockConfig,
  ProgramCoachesBlockConfig,
  ProgramResultsBlockConfig,
  ProgramTripsBlockConfig,
  ProgramCTABlockConfig,
]
export const locationDetailBlocks = [
  LocationHeroBlockConfig,
  LocationContentBlockConfig,
  LocationMapBlockConfig,
  LocationTripsBlockConfig,
]
export const guideDetailBlocks = [
  GuideHeroBlockConfig,
  GuideStatsBlockConfig,
  GuideAboutBlockConfig,
  GuideVideoBlockConfig,
  GuidePillarsBlockConfig,
  GuideTripsSectionBlockConfig,
  GuideAchievementsBlockConfig,
  GuideTestimonialBlockConfig,
  GuideCTABlockConfig,
]

export const pageBlocks = [
  ...contentBlocks,
  ...conversionBlocks,
  ...catalogueBlocks,
  ...mediaBlocks,
  ...socialProofBlocks,
]

export const eventLayoutBlocks = [
  ...tripDetailBlocks,
  CalendarBlockConfig,
  GalleryBlockConfig,
  VideoBlockConfig,
  FAQBlockConfig,
  ReviewGridBlockConfig,
  PartnerStripBlockConfig,
  GuideProfileBlockConfig,
]

export const programLayoutBlocks = [
  ...programDetailBlocks,
  TripGridBlockConfig,
  CalendarBlockConfig,
  GalleryBlockConfig,
  VideoBlockConfig,
  FAQBlockConfig,
  ReviewGridBlockConfig,
  GuideGridBlockConfig,
]

export const locationLayoutBlocks = [
  ...locationDetailBlocks,
  TripGridBlockConfig,
  CalendarBlockConfig,
  GalleryBlockConfig,
  VideoBlockConfig,
  FAQBlockConfig,
  ReviewGridBlockConfig,
  GuideGridBlockConfig,
  PartnerStripBlockConfig,
  CTABlockConfig,
]

export const guideLayoutBlocks = [
  ...guideDetailBlocks,
  GuideTripsBlockConfig,
  TripGridBlockConfig,
  CalendarBlockConfig,
  GalleryBlockConfig,
  VideoBlockConfig,
  FAQBlockConfig,
  ReviewGridBlockConfig,
  CTABlockConfig,
]
