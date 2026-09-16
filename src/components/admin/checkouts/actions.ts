'use server'

import { revalidatePath } from 'next/cache'
import { isAdminUser } from '@/access'
import { getCurrentUser, requireUser } from '@/lib/auth'
import { reviewGuestCheckout } from '@/lib/checkout/identity'
import { getPayloadClient } from '@/lib/payload'
import type { ActionResult } from '@/components/forms/action-result'
import type { PaymentAllocation } from '@/payments/checkout-ledger'
import {
  cancelPaidCheckout,
  recordCheckoutRefund,
  reconcileCheckoutExpiry,
  reconcileCheckoutPayment,
} from '@/payments/checkout-payment-service'
import { refundMinor } from './operations'

function revalidateCheckoutAdmin(checkoutId: number) {
  revalidatePath('/admin/collections/checkouts')
  revalidatePath('/admin/collections/checkouts/operations')
  if (Number.isSafeInteger(checkoutId) && checkoutId > 0) {
    revalidatePath(`/admin/collections/checkouts/${checkoutId}`)
    revalidatePath(`/admin/collections/checkouts/${checkoutId}/operations`)
    revalidatePath(`/account/checkouts/${checkoutId}`)
  }
}

export async function adminCheckoutReviewAction(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  const checkoutId = Number(data.get('checkout'))
  try {
    const decision = data.get('decision')
    if (decision !== 'approve' && decision !== 'decline')
      return { ok: false, formError: 'Choose approve or decline.' }
    await reviewGuestCheckout(
      checkoutId,
      await requireUser(),
      decision,
      String(data.get('note') ?? ''),
    )
    revalidateCheckoutAdmin(checkoutId)
    return { ok: true }
  } catch {
    return {
      ok: false,
      formError:
        'The review could not be fully completed. Refresh the checkout status before retrying; an approval may have saved even if its invitation email failed.',
    }
  }
}

export async function adminCheckoutOperationAction(
  _previous: ActionResult,
  data: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user || !isAdminUser(user)) return { ok: false, formError: 'Staff access is required.' }
  try {
    const checkoutId = Number(data.get('checkoutId'))
    if (!Number.isSafeInteger(checkoutId) || checkoutId < 1 || data.get('confirmed') !== 'yes')
      return { ok: false, formError: 'Confirm the operation before continuing.' }
    const operation = data.get('operation')
    if (operation === 'cancel') {
      const reason = String(data.get('reason') || '').trim()
      if (!reason || reason.length > 1000)
        return { ok: false, formError: 'Enter a cancellation reason, up to 1,000 characters.' }
      const itemIds = data.getAll('itemIds').map(Number)
      if (
        !itemIds.length ||
        itemIds.some((id) => !Number.isSafeInteger(id) || id < 1) ||
        new Set(itemIds).size !== itemIds.length
      )
        return { ok: false, formError: 'Select at least one trip to cancel.' }
      await cancelPaidCheckout(checkoutId, user, reason, itemIds)
    } else if (operation === 'expiry') {
      await reconcileCheckoutExpiry(checkoutId)
    } else if (operation === 'reconcile' || operation === 'refund') {
      const uuid = String(data.get('uuid') || '')
      if (!/^[0-9a-f-]{36}$/i.test(uuid))
        return { ok: false, formError: 'Select a valid payment receipt.' }
      const payload = await getPayloadClient()
      const { docs } = await payload.find({
        collection: 'transactions',
        where: { and: [{ uuid: { equals: uuid } }, { checkout: { equals: checkoutId } }] },
        limit: 1,
        depth: 0,
        overrideAccess: false,
        user,
      })
      const transaction = docs[0]
      if (!transaction)
        return { ok: false, formError: 'Payment receipt was not found for this reservation.' }
      if (operation === 'reconcile') await reconcileCheckoutPayment(uuid)
      else {
        const reference = String(data.get('providerReference') || '').trim()
        if (!reference || reference.length > 200)
          return {
            ok: false,
            formError: 'Enter the provider refund reference, up to 200 characters.',
          }
        const ledger = transaction.allocations as unknown as PaymentAllocation[] | null
        if (!Array.isArray(ledger))
          return { ok: false, formError: 'This payment has no item allocation ledger.' }
        const allocations = ledger.flatMap((allocation) => {
          const amount = String(data.get(`amount-${allocation.eventDateId}`) || '').trim()
          return amount
            ? [
                {
                  eventDateId: allocation.eventDateId,
                  orderId: allocation.orderId,
                  amountMinor: refundMinor(amount),
                },
              ]
            : []
        })
        if (!allocations.length)
          return { ok: false, formError: 'Enter at least one refunded item amount.' }
        await recordCheckoutRefund(uuid, user, reference, allocations)
      }
    } else return { ok: false, formError: 'Choose a supported operation.' }
    revalidateCheckoutAdmin(checkoutId)
    return { ok: true }
  } catch {
    return {
      ok: false,
      formError:
        'The operation could not be completed. Refresh the receipts before retrying; pending payments must be reconciled before cancellation, and refunds cannot exceed the original payment.',
    }
  }
}
