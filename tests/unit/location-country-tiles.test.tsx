import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import type { Location } from '@/payload-types'
import {
  CountryLocationCard,
  groupLocationsByCountry,
} from '@/components/blocks/CatalogueCards'

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

  const secondLocation = { ...location, id: 2, name: 'Chulilla', slug: 'chulilla' }
  const duplicateLocation = { ...location, id: 3, name: 'chulilla', slug: 'chulilla-sector' }
  const franceLocations = [
    { ...location, id: 4, name: 'Fontainebleau', slug: 'fontainebleau', country: 'France' },
    { ...location, id: 5, name: 'Verdon', slug: 'verdon', country: 'France' },
    { ...location, id: 6, name: 'Céüse', slug: 'ceuse', country: 'France' },
  ]
  const groups = groupLocationsByCountry(
    [location, secondLocation, duplicateLocation, ...franceLocations],
    8,
  )
  const markup = renderToStaticMarkup(
    <CountryLocationCard country={groups[1].country} locations={groups[1].locations} />,
  )

  expect(groups).toHaveLength(2)
  expect(groups.map((group) => group.country)).toEqual(['France', 'Spain'])
  expect(groups[1].locations).toHaveLength(2)
  expect(markup).toContain('Spain flag')
  expect(markup).toContain('flagcdn.com/w160/es.png')
  expect(markup).not.toContain('<img')
  expect(markup).toContain('El Chorro')
  expect(markup).toContain('Chulilla')
  expect(markup.match(/Chulilla/g)).toHaveLength(1)
  expect(markup).toContain('href="/destinations#spain"')
})
