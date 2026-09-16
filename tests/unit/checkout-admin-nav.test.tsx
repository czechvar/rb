// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { CheckoutOperationsNavLink } from '@/components/admin/checkouts/CheckoutOperationsNavLink'

const mocks = vi.hoisted(() => ({ pathname: '/admin/collections/checkouts' }))
vi.mock('next/navigation', () => ({ usePathname: () => mocks.pathname }))
afterEach(cleanup)

it('places the operations queue directly below Checkouts in the admin navigation', async () => {
  const sales = document.createElement('div')
  const checkouts = document.createElement('a')
  checkouts.id = 'nav-checkouts'
  sales.append(checkouts)
  document.body.append(sales)

  const view = render(<CheckoutOperationsNavLink />)

  await waitFor(() =>
    expect(checkouts.nextElementSibling?.querySelector('a')?.getAttribute('href')).toBe(
      '/admin/collections/checkouts/operations',
    ),
  )
  expect(screen.getByRole('link', { name: 'Operations queue' })).toBeTruthy()

  const nestedCheckouts = document.createElement('a')
  nestedCheckouts.id = 'nav-checkouts'
  checkouts.replaceWith(nestedCheckouts)
  mocks.pathname = '/admin/collections/checkouts/operations'
  view.rerender(<CheckoutOperationsNavLink />)

  await waitFor(() =>
    expect(nestedCheckouts.nextElementSibling?.querySelector('a')?.getAttribute('href')).toBe(
      '/admin/collections/checkouts/operations',
    ),
  )
  expect(screen.getByRole('link', { name: 'Operations queue' }).getAttribute('aria-current')).toBe(
    'page',
  )
})
