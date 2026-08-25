import { HeroBlockConfig } from './Hero/config'
import { SectionIntroBlockConfig } from './SectionIntro/config'
import { RichTextBlockConfig } from './RichText/config'
import { StatsBlockConfig } from './Stats/config'
import { CTABlockConfig } from './CTA/config'
import { TripGridBlockConfig } from './TripGrid/config'
import { MediaBlockConfig } from './Media/config'
import { GalleryBlockConfig } from './Gallery/config'
import { VideoBlockConfig } from './Video/config'
import { FAQBlockConfig } from './FAQ/config'

export const contentBlocks = [
  HeroBlockConfig,
  SectionIntroBlockConfig,
  RichTextBlockConfig,
  StatsBlockConfig,
]
export const conversionBlocks = [CTABlockConfig]
export const catalogueBlocks = [TripGridBlockConfig]
export const mediaBlocks = [MediaBlockConfig, GalleryBlockConfig, VideoBlockConfig]
export const socialProofBlocks = [FAQBlockConfig]

export const pageBlocks = [
  ...contentBlocks,
  ...conversionBlocks,
  ...catalogueBlocks,
  ...mediaBlocks,
  ...socialProofBlocks,
]
