import type { Post } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'

/** Deliberately excludes rich text and layouts from the browser/cache payload. */
export type BlogIndexPost = {
  id: number
  slug: string
  title: string
  excerpt: string
  author: string
  publishedAt: string | null
  image: { url: string; alt: string } | null
  category: { slug: string; name: string } | null
  readingMinutes: number | null
}

export function toBlogIndexPost(
  post: Pick<
    Post,
    | 'id'
    | 'slug'
    | 'title'
    | 'excerpt'
    | 'author'
    | 'publishedAt'
    | 'heroImage'
    | 'category'
    | 'content'
  >,
): BlogIndexPost {
  const url = mediaUrl(post.heroImage)
  const words = lexicalText(post.content).trim().split(/\s+/).filter(Boolean).length
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? '',
    author: post.author || 'Rockbusters',
    publishedAt: post.publishedAt ?? null,
    image: url ? { url, alt: mediaAlt(post.heroImage) || post.title } : null,
    category:
      post.category && typeof post.category === 'object'
        ? { slug: post.category.slug, name: post.category.name }
        : null,
    readingMinutes: words ? Math.max(1, Math.ceil(words / 200)) : null,
  }
}

function lexicalText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  if (Array.isArray(value)) return value.map(lexicalText).join(' ')
  const node = value as { text?: unknown; children?: unknown; root?: unknown }
  if (typeof node.text === 'string') return node.text
  return lexicalText(node.children ?? node.root)
}

export function filterBlogPosts(posts: BlogIndexPost[], category: string, sort: string) {
  const timestamp = (value: string | null) => (value ? Date.parse(value) || 0 : 0)
  return posts
    .filter((post) => category === 'all' || post.category?.slug === category)
    .sort((a, b) => {
      const difference = timestamp(b.publishedAt) - timestamp(a.publishedAt)
      return (sort === 'oldest' ? -difference : difference) || a.id - b.id
    })
}
