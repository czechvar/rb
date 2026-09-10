import type { Event, Guide, Media } from '@/payload-types'
import { GalleryBlock } from '@/components/blocks/GalleryBlock'
import { TripEditorialSection } from '@/components/sections/TripEditorialSection'
import { LocationBlock } from '@/components/sections/LocationBlock'
import { CoachesMinimal } from '@/components/sections/CoachesMinimal'
import { EventAccommodationLogistics } from '@/components/sections/EventAccommodationLogistics'
import styles from './page.module.css'

// Playground-only fixtures. These objects are never written to Payload or the seed.
const timestamp = '2026-01-01T00:00:00.000Z'
const image: Media = {
  id: 'playground-trip-variant-image',
  alt: 'Playground only: local Rockbusters logo used to inspect image layout',
  url: '/logo-rockbusters.png',
  updatedAt: timestamp,
  createdAt: timestamp,
}
const text = (value: string) => ({ type: 'text', version: 1, text: value, format: 0, detail: 0, mode: 'normal', style: '' })
function richText(value: string): NonNullable<Event['content']> {
  return { root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children: [
    { type: 'paragraph', version: 1, children: [text(value)], direction: null, format: '', indent: 0, textFormat: 0 },
  ] } }
}
const section: NonNullable<NonNullable<Event['tripDetail']>['sections']>[number] = {
  kind: 'learning',
  heading: '[Playground] Original source heading',
  body: {
    ...richText('[Playground] Introductory source paragraph, preserved across all three variants.'),
    root: {
      ...richText('').root,
      children: [
        ...richText('[Playground] Introductory source paragraph, preserved across all three variants.').root.children,
        { type: 'list', version: 1, listType: 'number', tag: 'ol', start: 3, direction: null, format: '', indent: 0,
          children: [
            { type: 'listitem', version: 1, value: 3, children: [text('[Playground] Original first stage, including its starting number.')], direction: null, format: '', indent: 0 },
            { type: 'listitem', version: 1, value: 4, children: [text('[Playground] Second source item with '), { ...text('original emphasis'), format: 1 }], direction: null, format: '', indent: 0 },
            { type: 'listitem', version: 1, value: 5, children: [text('[Playground] Third source item with a longer sentence to inspect wrapping on narrow screens.')], direction: null, format: '', indent: 0 },
          ],
        },
        ...richText('[Playground] Closing source paragraph remains visible after the list.').root.children,
      ],
    },
  },
}
const guide: Guide = {
  id: -1, name: '[Playground] Sample guide', slug: 'playground-trip-variant-guide', section: 'team',
  role: '[Playground] Source role', tagline: '[Playground] Original guide tagline for wrapping and spacing inspection.',
  photo: image, createdAt: timestamp, updatedAt: timestamp,
}
const accommodation: Event['accommodation'] = {
  description: richText('[Playground] Original accommodation paragraph.'),
  included: [{ text: '[Playground] Event default inclusion.' }],
  notIncluded: [{ text: '[Playground] Event default exclusion.' }],
}

export function TripVariantsPreview() {
  return (
    <section id="trip-variants" className={styles.section}>
      <div className={styles.sectionHeading}>
        <h2>Trip layout variants</h2>
        <p>Playground-only source fixtures. Images use the existing local logo to inspect layout. Theme controls apply to every specimen below.</p>
      </div>
      {(['prose', 'cards', 'timeline'] as const).map(variant => (
        <div key={variant} data-trip-specimen={`editorial-${variant}`}>
          <h3>Editorial: {variant}</h3>
          <TripEditorialSection section={section} variant={variant} />
        </div>
      ))}
      <div data-trip-specimen="gallery-default">
        <h3>Gallery: default grid</h3>
        <GalleryBlock blockType="gallery" source="manual" variant="grid" images={[image, { ...image, id: `${image.id}-default-2` }]} />
      </div>
      {[1, 2, 5].map(count => (
        <div key={count} data-trip-specimen={`gallery-${count}`}>
          <h3>Gallery: featureLead, {count} image{count === 1 ? '' : 's'}</h3>
          <GalleryBlock blockType="gallery" source="manual" variant="featureLead" images={Array.from({ length: count }, (_, i) => ({ ...image, id: `${image.id}-${i}` }))} />
        </div>
      ))}
      <div data-trip-specimen="venue-default">
        <h3>Venue: default</h3>
        <LocationBlock heading="[Playground] Venue" content={richText('[Playground] Original venue description.')} image={image} />
      </div>
      {[true, false].map(withImage => (
        <div key={String(withImage)} data-trip-specimen={`venue-${withImage ? 'image' : 'no-image'}`}>
          <h3>Venue: editorial, {withImage ? 'with' : 'without'} image</h3>
          <LocationBlock variant="editorial" heading="[Playground] Venue" content={richText('[Playground] Original venue description.')} image={withImage ? image : undefined} facts={[{ label: '[Playground] Source fact', value: '[Playground] Original value' }]} />
        </div>
      ))}
      <div data-trip-specimen="guides-default"><h3>Guides: default</h3><CoachesMinimal coaches={[guide]} /></div>
      <div data-trip-specimen="guides-cards"><h3>Guides: cards, with and without photo</h3><CoachesMinimal variant="cards" coaches={[guide, { ...guide, id: -2, name: '[Playground] Guide without photo', photo: null }]} /></div>
      <div data-trip-specimen="logistics-default"><h3>Logistics: default</h3><EventAccommodationLogistics accommodation={accommodation} /></div>
      <div data-trip-specimen="logistics-cards"><h3>Logistics: cards with date overrides</h3><EventAccommodationLogistics variant="cards" accommodation={accommodation} transport={{ description: richText('[Playground] Original transport copy.') }} logisticsOverrides={{ included: richText('[Playground] Date-specific inclusion replaces the event default.'), excluded: richText('[Playground] Date-specific exclusion replaces the event default.'), note: richText('[Playground] Original date-specific note.') }} /></div>
    </section>
  )
}
