import type { Event } from '@/payload-types'

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function eventCatalogueTitle(event: Event): string {
  return text(event.catalogueCard?.title) ?? event.title
}

export function eventCatalogueDescription(event: Event): string | null {
  return text(event.catalogueCard?.description) ?? text(event.shortDescription)
}
