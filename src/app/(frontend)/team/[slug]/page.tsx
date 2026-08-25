import { notFound } from 'next/navigation'
import { getGuideBySlug, getPublishedEventsForGuide } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { GuideHero } from '@/components/marketing/team/GuideHero'
import { GuideStatsBar } from '@/components/marketing/team/GuideStatsBar'
import { GuideAbout } from '@/components/marketing/team/GuideAbout'
import { GuidePillars } from '@/components/marketing/team/GuidePillars'
import { GuideTrips } from '@/components/marketing/team/GuideTrips'
import { GuideAchievements } from '@/components/marketing/team/GuideAchievements'
import { GuideTestimonial } from '@/components/marketing/team/GuideTestimonial'
import { GuideFinalCTA } from '@/components/marketing/team/GuideFinalCTA'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import styles from './guide.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)
  return { title: `${guide?.name ?? 'Guide'} — Rockbusters Team` }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)
  if (!guide) notFound()

  if (guide.layout?.length) {
    return (
      <MarketingShell transparentHeader>
        <main className={styles.page}>
          <RenderBlocks blocks={guide.layout} context={{ guide }} />
        </main>
      </MarketingShell>
    )
  }

  // Email/phone exist on the collection but are intentionally not rendered —
  // public team pages must not leak contacts (see team-pages spec).
  const events = await getPublishedEventsForGuide(guide.id)

  return (
    <MarketingShell transparentHeader>
      <main className={styles.page}>
        <GuideHero guide={guide} />
        <GuideStatsBar stats={guide.stats} />
        <GuideAbout guide={guide} />
        {guide.vimeoId ? (
          <section className={styles.video}>
            <iframe
              src={`https://player.vimeo.com/video/${guide.vimeoId}`}
              title={`${guide.name} — video`}
              allow="fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </section>
        ) : null}
        <GuidePillars guide={guide} />
        <GuideTrips guide={guide} events={events} />
        <GuideAchievements data={guide.achievements} />
        <GuideTestimonial guide={guide} />
        <GuideFinalCTA firstName={guide.name.split(' ')[0]} />
      </main>
    </MarketingShell>
  )
}
