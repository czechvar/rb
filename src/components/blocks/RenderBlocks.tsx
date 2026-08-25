import type { Page } from '@/payload-types'
import { HeroBlock } from './HeroBlock'
import { CTABlock } from './CTABlock'
import { TripGridBlock } from './TripGridBlock'
import { MediaBlock } from './MediaBlock'
import { FAQBlock } from './FAQBlock'

type PageBlock = NonNullable<Page['layout']>[number]

async function renderBlock(block: PageBlock, index: number) {
  const key = block.id ?? `${block.blockType}-${index}`
  switch (block.blockType) {
    case 'hero':
      return <HeroBlock key={key} {...block} />
    case 'cta':
      return <CTABlock key={key} {...block} />
    case 'tripGrid':
      return <TripGridBlock key={key} {...block} />
    case 'mediaBlock':
      return <MediaBlock key={key} {...block} />
    case 'faq':
      return <FAQBlock key={key} {...block} />
    default:
      return null
  }
}

export async function RenderBlocks({ blocks }: { blocks?: Page['layout'] | null }) {
  if (!blocks?.length) return null
  return <>{await Promise.all(blocks.map(renderBlock))}</>
}
