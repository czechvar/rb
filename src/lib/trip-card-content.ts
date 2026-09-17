import type { Event, EventDate, TripVariant } from '@/payload-types'
import { eventCatalogueTitle } from './event-catalogue-card'
import { mediaAlt, mediaUrl } from './media'
import { headingText, resolveTripEditorial, type HeadingPart } from './trip-editorial'

export type TripCardImage = {
  url: string
  alt: string
  width?: number | null
  height?: number | null
}

export type TripCardContent = {
  title: string
  titleParts: HeadingPart[] | null
  image: TripCardImage | null
  imageCandidates: TripCardImage[]
}

function copyTitleParts(parts?: HeadingPart[] | null): HeadingPart[] | null {
  if (!parts?.length) return null
  return parts.map(({ text, accent, breakBefore }) => ({ text, accent, breakBefore }))
}

function imageCandidates(event: Event): TripCardImage[] {
  return [event.mainPicture, ...(event.gallery ?? [])]
    .map((media): TripCardImage | null => {
      const url = mediaUrl(media)
      if (!url) return null
      return {
        url,
        alt: mediaAlt(media),
        width: typeof media === 'object' && media ? media.width : undefined,
        height: typeof media === 'object' && media ? media.height : undefined,
      }
    })
    .filter((image): image is TripCardImage => image !== null)
    .filter((image, index, images) => images.findIndex((candidate) => candidate.url === image.url) === index)
}

/** Resolves the card identity from the same Event → Trip Variant → Event Date editorial chain as the trip hero. */
export function resolveTripCardContent(event: Event, date?: EventDate): TripCardContent {
  const variant = date?.tripVariant && typeof date.tripVariant === 'object'
    ? date.tripVariant as TripVariant
    : null
  const inheritedEditorial = resolveTripEditorial(event.editorial, variant?.editorial)
  const editorial = date ? resolveTripEditorial(inheritedEditorial, date.editorial) : inheritedEditorial
  const titleParts = copyTitleParts(editorial.hero?.titleParts)
  const candidates = imageCandidates(event)

  return {
    title: titleParts?.length
      ? headingText(titleParts)
      : date
        ? event.title
        : eventCatalogueTitle(event),
    titleParts,
    image: candidates[0] ?? null,
    imageCandidates: candidates,
  }
}
