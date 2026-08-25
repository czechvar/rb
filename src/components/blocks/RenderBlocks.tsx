import React from 'react'
import type { Event, Guide, Location, Page, Program } from '@/payload-types'
import { HeroBlock } from './HeroBlock'
import { CTABlock } from './CTABlock'
import { TripGridBlock } from './TripGridBlock'
import { MediaBlock } from './MediaBlock'
import { FAQBlock } from './FAQBlock'

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
  cta: (block) => <CTABlock {...(block as Extract<PageBlock, { blockType: 'cta' }>)} />,
  tripGrid: (block) => <TripGridBlock {...(block as Extract<PageBlock, { blockType: 'tripGrid' }>)} />,
  mediaBlock: (block) => <MediaBlock {...(block as Extract<PageBlock, { blockType: 'mediaBlock' }>)} />,
  faq: (block) => <FAQBlock {...(block as Extract<PageBlock, { blockType: 'faq' }>)} />,
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
