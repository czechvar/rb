import type { Block } from 'payload'

export const PostBodyBlockConfig: Block = {
  slug: 'postBody',
  labels: { singular: 'Post Body', plural: 'Post Bodies' },
  fields: [],
}

export const PostBodyBlock = PostBodyBlockConfig
