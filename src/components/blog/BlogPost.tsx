import Image from 'next/image'
import Link from 'next/link'
import type { Post } from '@/payload-types'
import { toBlogIndexPost } from '@/lib/blog-index'
import { Lexical } from '@/lib/lexical'
import { CTABlock } from '@/components/blocks/CTABlock'
import { formatPostDate } from '@/app/(frontend)/blog/PostCard'
import styles from './blog-post.module.css'

/** Default editorial template; authored CMS layouts remain owned by the route. */
export function BlogPost({ post }: { post: Post }) {
  const story = toBlogIndexPost(post)

  return (
    <main className={styles.page}>
      <article aria-labelledby="story-title">
        <header className={styles.hero}>
          <div className={styles.container}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link><span aria-hidden="true">/</span>
              <Link href="/blog">Blog</Link><span aria-hidden="true">/</span>
              <span aria-current="page">Article</span>
            </nav>
            <div className={story.image ? styles.heroGrid : styles.heroTextOnly}>
              <div className={styles.intro}>
                <p data-eyebrow="hero" className={styles.eyebrow}>
                  {story.category ? (
                    <Link href={`/blog/category/${story.category.slug}`}>{story.category.name}</Link>
                  ) : 'Stories from the rock'}
                </p>
                <h1 id="story-title">{story.title}</h1>
                {story.excerpt ? <p className={styles.lead}>{story.excerpt}</p> : null}
                <div className={styles.byline}>
                  <span>By <strong>{story.author}</strong></span>
                  {story.publishedAt ? <time dateTime={story.publishedAt}>{formatPostDate(story.publishedAt)}</time> : null}
                  {story.readingMinutes ? <span>{story.readingMinutes} min read</span> : null}
                </div>
              </div>
              {story.image ? (
                <div className={styles.photo}>
                  <Image src={story.image.url} alt={story.image.alt} fill priority sizes="(max-width: 900px) 90vw, 45vw" />
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <div className={`${styles.container} ${styles.readingLayout}`}>
          <aside className={styles.sidebar} aria-label="More from the blog">
            <p data-eyebrow="section" className={styles.eyebrow}>The Rockbusters blog</p>
            <p>Stories, places and people behind the climbing.</p>
            <Link href="/blog">All stories <span aria-hidden="true">↗</span></Link>
            {story.category ? <Link href={`/blog/category/${story.category.slug}`}>More in {story.category.name} <span aria-hidden="true">↗</span></Link> : null}
          </aside>
          <div className={styles.reading}>
            <div className={styles.prose}><Lexical data={post.content} /></div>
            <footer className={styles.articleFooter}>
              <span>{story.author}</span>
              <Link href="/blog">Back to all stories <span aria-hidden="true">→</span></Link>
            </footer>
          </div>
        </div>
      </article>
      <CTABlock
        blockType="cta"
        variant="finalRed"
        eyebrow="From reading to climbing"
        heading="Your next story starts here"
        body="Join us on the rock. Explore climbing trips and coaching with Rockbusters."
        primaryAction={{ label: 'Explore the trips', href: '/trips' }}
        secondaryAction={{ label: 'More stories', href: '/blog' }}
      />
    </main>
  )
}
