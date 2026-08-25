import React from 'react'
import type { Event, Guide, Location, Page, Program } from '@/payload-types'
import { HeroBlock } from './HeroBlock'
import { SectionIntroBlock } from './SectionIntroBlock'
import { RichTextBlock } from './RichTextBlock'
import { StatsBlock } from './StatsBlock'
import { CTABlock } from './CTABlock'
import { TripGridBlock } from './TripGridBlock'
import { ProgramGridBlock } from './ProgramGridBlock'
import { LocationGridBlock } from './LocationGridBlock'
import { GuideGridBlock } from './GuideGridBlock'
import { MediaBlock } from './MediaBlock'
import { GalleryBlock } from './GalleryBlock'
import { VideoBlock } from './VideoBlock'
import { FAQBlock } from './FAQBlock'
import { ReviewGridBlock } from './ReviewGridBlock'

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
  tripGrid: (block) => TripGridBlock(block as Extract<PageBlock, { blockType: 'tripGrid' }>),
  programGrid: (block) =>
    ProgramGridBlock(block as Extract<PageBlock, { blockType: 'programGrid' }>),
  locationGrid: (block) =>
    LocationGridBlock(block as Extract<PageBlock, { blockType: 'locationGrid' }>),
  guideGrid: (block) => GuideGridBlock(block as Extract<PageBlock, { blockType: 'guideGrid' }>),
  mediaBlock: (block) => <MediaBlock {...(block as Extract<PageBlock, { blockType: 'mediaBlock' }>)} />,
  gallery: (block) => <GalleryBlock {...(block as Extract<PageBlock, { blockType: 'gallery' }>)} />,
  video: (block) => <VideoBlock {...(block as Extract<PageBlock, { blockType: 'video' }>)} />,
  faq: (block) => FAQBlock(block as Extract<PageBlock, { blockType: 'faq' }>),
  reviewGrid: (block) =>
    ReviewGridBlock(block as Extract<PageBlock, { blockType: 'reviewGrid' }>),
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
