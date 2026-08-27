import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { type BlockRenderContext, RenderBlocks } from '@/components/blocks/RenderBlocks'
import { getTestPayload } from '../helpers/payload'
import type { Post } from '@/payload-types'

type RenderBlocksInput = Parameters<typeof RenderBlocks>[0]

const trackedIds: Record<string, number[]> = {}

const richText = (text: string): Record<string, unknown> => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', version: 1, text }],
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
})

describe('Post layout blocks', () => {
  afterEach(async () => {
    const payload = await getTestPayload()

    for (const collection of ['posts', 'post-categories']) {
      const ids = trackedIds[collection]
      if (!ids?.length) continue
      await payload.delete({ collection: collection as never, where: { id: { in: ids } } })
      trackedIds[collection] = []
    }
  })

  it('renders post-specific blocks from the current Post context', async () => {
    const post = {
      id: 9401,
      title: 'POC Post Layout',
      slug: 'poc-post-layout',
      excerpt: 'Post excerpt from the current Post record.',
      author: 'Rockbusters',
      publishedAt: '2026-08-20T09:00:00.000Z',
      state: 'published',
      content: richText('Post body from the current Post record.'),
    } as Post

    const element = await RenderBlocks({
      blocks: [
        { blockType: 'postHero' },
        { blockType: 'postBody' },
        { blockType: 'postCTA' },
      ] as RenderBlocksInput['blocks'],
      context: { post } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain('POC Post Layout')
    expect(markup).toContain('Post excerpt from the current Post record.')
    expect(markup).toContain('Post body from the current Post record.')
    expect(markup).toContain('Keep Exploring')
  })

  it('uses the current Post context for related posts', async () => {
    const payload = await getTestPayload()
    const stamp = Date.now()
    const category = await payload.create({
      collection: 'post-categories',
      data: {
        name: `POC Related Category ${stamp}`,
        slug: `poc-related-category-${stamp}`,
      },
    })
    track('post-categories', category.id)

    const current = await payload.create({
      collection: 'posts',
      data: {
        title: `POC Current Post ${stamp}`,
        slug: `poc-current-post-${stamp}`,
        category: category.id,
        state: 'published',
        publishedAt: '2026-08-20T09:00:00.000Z',
      },
    })
    track('posts', current.id)

    const related = await payload.create({
      collection: 'posts',
      data: {
        title: `POC Related Post ${stamp}`,
        slug: `poc-related-post-${stamp}`,
        category: category.id,
        state: 'published',
        publishedAt: '2026-08-19T09:00:00.000Z',
      },
    })
    track('posts', related.id)

    const element = await RenderBlocks({
      blocks: [
        { blockType: 'relatedPosts', heading: 'Related reading', limit: 3 },
      ] as RenderBlocksInput['blocks'],
      context: { post: current } as BlockRenderContext,
    })

    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, element))
    expect(markup).toContain(`POC Related Post ${stamp}`)
    expect(markup).toContain(`/blog/poc-related-post-${stamp}`)
    expect(markup).not.toContain(`POC Current Post ${stamp}`)
  })
})

function track(collection: string, id: number) {
  trackedIds[collection] ??= []
  trackedIds[collection].push(id)
}
