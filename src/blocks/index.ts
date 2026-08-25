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
