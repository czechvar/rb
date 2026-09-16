import { expect, it } from 'vitest'
import { Checkouts } from '@/collections/Checkouts'

it('keeps checkout queues and document operations inside Payload Admin', () => {
  const collectionViews = Checkouts.admin?.components?.views as Record<string, unknown> | undefined
  const editViews = Checkouts.admin?.components?.views?.edit as Record<string, unknown> | undefined
  const operations = editViews?.operations

  expect(operations).toMatchObject({
    Component: '/components/admin/checkouts/CheckoutOperationsView#CheckoutOperationsView',
    path: '/operations',
    tab: { label: 'Operations' },
  })
  expect(collectionViews?.operations).toMatchObject({
    Component:
      '/components/admin/checkouts/CheckoutOperationsQueueView#CheckoutOperationsQueueView',
    path: '/operations',
  })
  expect(Checkouts.admin?.components?.beforeList).toContain(
    '/components/admin/checkouts/CheckoutOperationsQueueView#CheckoutOperationsListLink',
  )
  expect(Checkouts.admin?.description).toContain('Operations tab')
  expect(Checkouts.admin?.description).not.toContain('checkout review screen')
})
