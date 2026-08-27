import type { Block } from 'payload'

export const RelatedPostsBlockConfig: Block = {
  slug: 'relatedPosts',
  labels: { singular: 'Related Posts', plural: 'Related Posts' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Related Reading',
    },
    {
      name: 'limit',
      type: 'number',
      min: 1,
      max: 6,
      defaultValue: 3,
      required: true,
    },
  ],
}

export const RelatedPostsBlock = RelatedPostsBlockConfig
