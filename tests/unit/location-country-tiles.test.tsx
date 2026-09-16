import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import type { Location } from '@/payload-types'
import { LocationCard } from '@/components/blocks/CatalogueCards'

it('uses a country flag instead of the selected location image for country tiles', () => {
  const location = {
    id: 1,
    name: 'El Chorro',
    slug: 'el-chorro',
    city: 'Álora',
    country: 'Spain',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    mainPicture: {
      id: 'media-10',
      url: '/media/el-chorro.jpg',
      alt: 'El Chorro cliffs',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  } as Location

  const markup = renderToStaticMarkup(
    <LocationCard location={location} variant="countryTiles" />,
  )

  expect(markup).toContain('Spain flag')
  expect(markup).toContain('flagcdn.com/w160/es.png')
  expect(markup).not.toContain('<img')
  expect(markup).toContain('El Chorro')
})
