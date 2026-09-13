'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { filterBlogPosts, type BlogIndexPost } from '@/lib/blog-index'
import styles from './blog-index.module.css'

type Props = {
  posts: BlogIndexPost[]
  categories: { slug: string; name: string }[]
  archiveCategory?: string
  featuredId?: number | null
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
}

export function BlogIndex({ posts, categories, featuredId, eyebrow, heading, intro, archiveCategory }: Props) {
  const [category, setCategory] = useState(archiveCategory || 'all')
  const [sort, setSort] = useState('newest')
  const resultsRef = useRef<HTMLDivElement>(null)
  const pillsRef = useRef<HTMLDivElement>(null)
  const sortId = useId()

  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search)
      setCategory(archiveCategory || params.get('category') || 'all')
      setSort(params.get('sort') === 'oldest' ? 'oldest' : 'newest')
    }
    restore()
    // Reveal the route's selected category without scrolling past the hero.
    const pills = pillsRef.current
    const active = pills?.querySelector<HTMLElement>('[aria-current="page"]')
    if (archiveCategory && pills && active) {
      pills.scrollLeft += active.getBoundingClientRect().left - pills.getBoundingClientRect().left
        - (pills.clientWidth - active.clientWidth) / 2
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [archiveCategory])

  function change(nextCategory: string, nextSort: string) {
    setCategory(nextCategory)
    setSort(nextSort)
    const url = new URL(window.location.href)
    if (archiveCategory || nextCategory === 'all') url.searchParams.delete('category')
    else url.searchParams.set('category', nextCategory)
    if (nextSort === 'newest') url.searchParams.delete('sort')
    else url.searchParams.set('sort', nextSort)
    window.history.pushState(null, '', url)
    if (resultsRef.current && resultsRef.current.getBoundingClientRect().top < 0) {
      resultsRef.current.scrollIntoView({ block: 'start' })
    }
  }

  const filtered = filterBlogPosts(posts, category, sort)
  const featured =
    (category === 'all' || category === archiveCategory) && sort === 'newest'
      ? (posts.find((post) => post.id === featuredId) ?? filtered[0])
      : undefined
  const gridPosts = featured ? filtered.filter((post) => post.id !== featured.id) : filtered
  const years = new Set(posts.map((post) => post.publishedAt?.slice(0, 4)).filter(Boolean))
  const stats = [
    { value: posts.length, label: 'Articles' },
    { value: archiveCategory ? 1 : categories.length, label: 'Categories' },
    { value: new Set(posts.map((post) => post.author)).size, label: 'Bylines' },
    { value: years.size, label: 'Years of stories' },
  ]

  return (
    <section className={styles.index} aria-label="Blog stories">
      <dl className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.value}</dt>
            <dd>{stat.label}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.filters}>
        <div className={styles.filterInner}>
          <div className={styles.pills} ref={pillsRef} role="group" aria-label="Filter stories by category">
            {[{ slug: 'all', name: 'All' }, ...categories].map((item) => (
              archiveCategory ? (
                <Link
                  key={item.slug}
                  href={item.slug === 'all' ? '/blog' : `/blog/category/${item.slug}`}
                  aria-current={category === item.slug ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ) : <button
                type="button"
                key={item.slug}
                aria-pressed={category === item.slug}
                onClick={() => change(item.slug, sort)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className={styles.sort}>
            <label htmlFor={sortId}>Sort</label>
            <select
              id={sortId}
              value={sort}
              onChange={(event) => change(category, event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      </div>
      <div className={styles.content} ref={resultsRef}>
        {featured ? (
          <>
            <header className={styles.heading}>
              <p data-eyebrow="section">{eyebrow || 'Latest dispatch'}</p>
              <h2>{heading || 'Fresh off the rock'}</h2>
              {intro ? <p className={styles.intro}>{intro}</p> : null}
            </header>
            <PostCard post={featured} featured />
          </>
        ) : (
          <h2 className={styles.resultsHeading}>
            {categories.find((item) => item.slug === category)?.name || 'Stories'}
          </h2>
        )}
        <p role="status" className={styles.count}>
          {filtered.length} {filtered.length === 1 ? 'story' : 'stories'}
        </p>
        {gridPosts.length ? (
          <div className={styles.grid}>
            {gridPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : !featured ? (
          <div className={styles.empty}>
            <p>No stories in this category yet — check back soon or try another filter.</p>
            {archiveCategory ? <Link href="/blog">Show all stories</Link> : (
              <button type="button" onClick={() => change('all', 'newest')}>
                Show all stories
              </button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function PostCard({ post, featured = false }: { post: BlogIndexPost; featured?: boolean }) {
  return (
    <article className={featured ? styles.featured : styles.card} data-blog-post={post.slug}>
      <Link href={`/blog/${post.slug}`} className={styles.media} tabIndex={-1} aria-hidden="true">
        {post.image ? (
          <Image
            src={post.image.url}
            alt={post.image.alt}
            fill
            sizes={
              featured
                ? '(max-width: 900px) 90vw, 50vw'
                : '(max-width: 560px) 90vw, (max-width: 900px) 45vw, 30vw'
            }
          />
        ) : (
          <span className={styles.placeholder}>Stories from the rock</span>
        )}
        {featured ? <span className={styles.badge}>Featured</span> : null}
      </Link>
      <div className={styles.body}>
        <div className={styles.meta}>
          {post.category ? (
            <Link className={styles.category} href={`/blog/category/${post.category.slug}`}>
              {post.category.name}
            </Link>
          ) : null}
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </time>
          ) : null}
          {featured && post.readingMinutes ? <span>{post.readingMinutes} min read</span> : null}
        </div>
        <h3>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt ? <p className={styles.excerpt}>{post.excerpt}</p> : null}
        <div className={styles.foot}>
          <span>{post.author}</span>
          <Link
            href={`/blog/${post.slug}`}
            aria-label={`Read article: ${post.title}`}
            className={styles.read}
          >
            Read article <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
