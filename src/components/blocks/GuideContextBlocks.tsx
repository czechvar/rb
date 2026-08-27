import type { Guide } from '@/payload-types'
import { getPublishedEventsForGuide } from '@/lib/queries'
import { GuideHero } from '@/components/marketing/team/GuideHero'
import { GuideStatsBar } from '@/components/marketing/team/GuideStatsBar'
import { GuideAbout } from '@/components/marketing/team/GuideAbout'
import { GuidePillars } from '@/components/marketing/team/GuidePillars'
import { GuideTrips } from '@/components/marketing/team/GuideTrips'
import { GuideAchievements } from '@/components/marketing/team/GuideAchievements'
import { GuideTestimonial } from '@/components/marketing/team/GuideTestimonial'
import { GuideFinalCTA } from '@/components/marketing/team/GuideFinalCTA'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'

type GuideContextBlock = Record<string, unknown>

export function GuideHeroBlock(_block: GuideContextBlock, { guide }: BlockRenderContext) {
  if (!isGuide(guide)) return null
  return <GuideHero guide={guide} />
}

export function GuideStatsBlock(_block: GuideContextBlock, { guide }: BlockRenderContext) {
  if (!isGuide(guide)) return null
  return <GuideStatsBar stats={guide.stats} />
}

export function GuideAboutBlock(_block: GuideContextBlock, { guide }: BlockRenderContext) {
  if (!isGuide(guide)) return null
  return <GuideAbout guide={guide} />
}

export function GuideVideoBlock(_block: GuideContextBlock, { guide }: BlockRenderContext) {
  if (!isGuide(guide) || !guide.vimeoId) return null

  return (
    <section className={styles.guideVideoSection}>
      <iframe
        src={`https://player.vimeo.com/video/${guide.vimeoId}`}
        title={`${guide.name} - video`}
        allow="fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </section>
  )
}

export function GuidePillarsBlock(_block: GuideContextBlock, { guide }: BlockRenderContext) {
  if (!isGuide(guide)) return null
  return <GuidePillars guide={guide} />
}

export async function GuideTripsSectionBlock(
  _block: GuideContextBlock,
  { guide }: BlockRenderContext,
) {
  if (!isGuide(guide)) return null
  const events = await getPublishedEventsForGuide(guide.id)
  return <GuideTrips guide={guide} events={events} />
}

export function GuideAchievementsBlock(_block: GuideContextBlock, { guide }: BlockRenderContext) {
  if (!isGuide(guide)) return null
  return <GuideAchievements data={guide.achievements} />
}

export function GuideTestimonialBlock(_block: GuideContextBlock, { guide }: BlockRenderContext) {
  if (!isGuide(guide)) return null
  return <GuideTestimonial guide={guide} />
}

export function GuideCTABlock(_block: GuideContextBlock, { guide }: BlockRenderContext) {
  if (!isGuide(guide)) return null
  return <GuideFinalCTA firstName={guide.name.split(' ')[0]} />
}

function isGuide(guide: BlockRenderContext['guide']): guide is Guide {
  return typeof guide === 'object' && guide !== null
}
