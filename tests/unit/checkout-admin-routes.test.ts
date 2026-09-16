import { beforeEach, expect, it, vi } from 'vitest'
import LegacyCheckoutReviewPage from '@/app/(frontend)/checkout/review/page'
import LegacyCheckoutOperationsPage from '@/app/(frontend)/checkout/operations/page'
import LegacyCheckoutOperationPage from '@/app/(frontend)/checkout/operations/[id]/page'

const mocks = vi.hoisted(() => ({ redirect: vi.fn(), notFound: vi.fn() }))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    mocks.redirect(path)
    throw new Error('redirect')
  },
  notFound: () => {
    mocks.notFound()
    throw new Error('not-found')
  },
}))

beforeEach(() => vi.clearAllMocks())

it('sends former staff pages into Payload Admin', async () => {
  expect(() => LegacyCheckoutReviewPage()).toThrow('redirect')
  expect(mocks.redirect).toHaveBeenLastCalledWith(
    '/admin/collections/checkouts/operations?filter=waiting-review',
  )

  expect(() => LegacyCheckoutOperationsPage()).toThrow('redirect')
  expect(mocks.redirect).toHaveBeenLastCalledWith('/admin/collections/checkouts/operations')

  await expect(
    LegacyCheckoutOperationPage({ params: Promise.resolve({ id: '42' }) }),
  ).rejects.toThrow('redirect')
  expect(mocks.redirect).toHaveBeenLastCalledWith('/admin/collections/checkouts/42/operations')
})

it('does not forward an invalid checkout id into the admin route', async () => {
  await expect(
    LegacyCheckoutOperationPage({ params: Promise.resolve({ id: 'invalid' }) }),
  ).rejects.toThrow('not-found')
  expect(mocks.notFound).toHaveBeenCalledOnce()
  expect(mocks.redirect).not.toHaveBeenCalled()
})
