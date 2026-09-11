import { describe, expect, it, vi } from 'vitest'
import { filterBlogPosts, toBlogIndexPost } from '@/lib/blog-index'
import type { Post } from '@/payload-types'
import { getBlogIndex } from '@/lib/queries'

const { find } = vi.hoisted(() => ({ find: vi.fn() }))
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ find }) }))
vi.mock('@/lib/cache', () => ({
  TAGS: { posts: 'posts', postCategories: 'post-categories', media: 'media' },
  cachedQuery: (_key: unknown, _tags: unknown, fn: () => unknown) => fn(),
}))

const post = (id: number, extra = {}) =>
  ({
    id,
    title: `Story ${id}`,
    slug: `story-${id}`,
    state: 'published',
    publishedAt: `2026-01-${String(id).padStart(2, '0')}T12:00:00Z`,
    ...extra,
  }) as Post

describe('blog index', () => {
  it('fetches every published page and returns compact cards without article bodies', async () => {
    find
      .mockReset()
      .mockResolvedValueOnce({ docs: [post(1)], hasNextPage: true })
      .mockResolvedValueOnce({ docs: [post(2)], hasNextPage: false })
      .mockResolvedValueOnce({ docs: [{ name: 'Training', slug: 'training' }], hasNextPage: false })
    const result = await getBlogIndex()
    expect(result.posts.map((post) => post.id)).toEqual([1, 2])
    expect(find.mock.calls[0][0].where).toEqual({ state: { equals: 'published' } })
    expect(find.mock.calls[1][0].page).toBe(2)
    expect(result.categories).toEqual([{ name: 'Training', slug: 'training' }])
    expect(result.posts[0]).not.toHaveProperty('content')
    expect(result.posts[0]).not.toHaveProperty('layout')
  })

  it('filters and sorts without mutating the source; uncategorized posts remain in All', () => {
    const posts = [
      toBlogIndexPost(post(1)),
      toBlogIndexPost(post(2, { category: { slug: 'training', name: 'Training' } })),
    ]
    expect(filterBlogPosts(posts, 'all', 'newest').map((post) => post.id)).toEqual([2, 1])
    expect(filterBlogPosts(posts, 'all', 'oldest').map((post) => post.id)).toEqual([1, 2])
    expect(filterBlogPosts(posts, 'training', 'newest').map((post) => post.id)).toEqual([2])
    expect(filterBlogPosts(posts, 'empty-category', 'newest')).toEqual([])
    expect(posts.map((post) => post.id)).toEqual([1, 2])
  })

  it('handles missing media/date and estimates reading time from text, not serialized markup', () => {
    const card = toBlogIndexPost(
      post(1, {
        publishedAt: null,
        content: {
          root: {
            children: [
              { type: 'paragraph', children: [{ type: 'text', text: 'word '.repeat(401) }] },
            ],
          },
        },
      }),
    )
    expect(card.readingMinutes).toBe(3)
    expect(card.image).toBeNull()
    expect(card.publishedAt).toBeNull()
    expect(toBlogIndexPost(post(1)).readingMinutes).toBeNull()
  })
})
