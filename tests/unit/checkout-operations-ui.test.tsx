// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { ActionResult } from '@/components/forms/action-result'
import { CheckoutAdminOperationForm } from '@/components/admin/checkouts/CheckoutAdminForms'
const mocks = vi.hoisted(() => ({ action: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/components/admin/checkouts/actions', () => ({
  adminCheckoutOperationAction: mocks.action,
}))
afterEach(cleanup)
it('locks a submitted financial operation and preserves receipt inputs after failure', async () => {
  let finish!: (result: ActionResult) => void
  mocks.action.mockReturnValue(
    new Promise<ActionResult>((resolve) => {
      finish = resolve
    }),
  )
  render(
    <CheckoutAdminOperationForm
      checkoutId={10}
      operation="refund"
      uuid="12345678-1234-4234-8234-123456789abc"
      label="Record refund"
    >
      <label>
        Provider receipt
        <input name="providerReference" defaultValue="receipt-test-1" />
      </label>
    </CheckoutAdminOperationForm>,
  )
  fireEvent.click(screen.getByRole('checkbox'))
  const form = screen.getByRole('button').closest('form')!
  fireEvent.submit(form)
  fireEvent.submit(form)
  await waitFor(() =>
    expect(screen.getByRole('button').closest('fieldset')?.hasAttribute('disabled')).toBe(true),
  )
  expect(mocks.action).toHaveBeenCalledTimes(1)
  await act(async () => finish({ ok: false, formError: 'Refresh receipts first.' }))
  expect(screen.getByRole('alert').textContent).toBe('Refresh receipts first.')
  expect((screen.getByLabelText('Provider receipt') as HTMLInputElement).value).toBe(
    'receipt-test-1',
  )
  expect(screen.getByRole('button').closest('fieldset')?.hasAttribute('disabled')).toBe(false)
})
