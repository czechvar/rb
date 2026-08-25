import { HeroBlockConfig } from './Hero/config'
import { CTABlockConfig } from './CTA/config'
import { TripGridBlockConfig } from './TripGrid/config'
import { MediaBlockConfig } from './Media/config'
import { FAQBlockConfig } from './FAQ/config'

export const contentBlocks = [HeroBlockConfig]
export const conversionBlocks = [CTABlockConfig]
export const catalogueBlocks = [TripGridBlockConfig]
export const mediaBlocks = [MediaBlockConfig]
export const socialProofBlocks = [FAQBlockConfig]

export const pageBlocks = [
  ...contentBlocks,
  ...conversionBlocks,
  ...catalogueBlocks,
  ...mediaBlocks,
  ...socialProofBlocks,
]
