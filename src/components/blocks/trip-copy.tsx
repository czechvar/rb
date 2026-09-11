import type { ReactNode } from 'react'
import { HeadingText } from '@/components/ui/EditorialHeading'
import { resolveSectionCopy, type SectionCopy, type TripSectionKey } from '@/lib/trip-editorial'
import type { TripDetailView } from '@/lib/trip-detail'

/** Synthesized labels are fallbacks; only saved layout text overrides authored copy. */
export function tripCopy(
  trip: TripDetailView | null | undefined,
  key: TripSectionKey,
  block: Record<string, unknown> = {},
  defaults: SectionCopy = {},
) {
  const fields: SectionCopy = {
    eyebrow: typeof block.eyebrow === 'string' ? block.eyebrow : undefined,
    heading: typeof block.heading === 'string' ? block.heading : undefined,
    intro:
      typeof block.intro === 'string'
        ? block.intro
        : typeof block.body === 'string'
          ? block.body
          : undefined,
  }
  const copy = resolveSectionCopy(
    key,
    trip?.editorial,
    {
      ...defaults,
      ...(block.__defaultCopy
        ? Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined))
        : {}),
    },
    block.__defaultCopy ? {} : fields,
  )
  const heading: ReactNode = copy.headingParts?.length ? (
    <HeadingText parts={copy.headingParts} />
  ) : (
    copy.heading
  )
  return { ...copy, heading, eyebrow: copy.eyebrow ?? undefined, intro: copy.intro ?? undefined }
}
