import { expect, it, vi } from 'vitest'
import { resolveGuideGridGuides } from '@/lib/block-resolvers/domain-grids'

const { find } = vi.hoisted(() => ({ find: vi.fn() }))
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ find }) }))

it('renders a full roster larger than twelve while retaining the six-guide teaser default', async () => {
  const guides = Array.from({ length: 32 }, (_, index) => ({ id: index + 1, active: true }))
  find.mockImplementation(async ({ limit }: { limit: number }) => ({ docs: guides.slice(0, limit) }))
  expect(await resolveGuideGridGuides({ source: 'team', limit: 100 })).toHaveLength(32)
  expect(await resolveGuideGridGuides({ source: 'team' })).toHaveLength(6)
})
