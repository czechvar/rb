/**
 * Where the payer's browser lands after the Benefit+ gateway. Benefit+ sends
 * no webhook, so this is the first chance to learn the result — but the
 * redirect itself proves nothing, so the state is read from the gateway.
 *
 * This route never shows the payer an error: if the status check fails, the
 * cron sweep will resolve the payment shortly, and the order page they land
 * on shows the current truth either way.
 */

import { getPayloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/url'
import { resolveBenefitPlusPayment } from '@/payments/order-payment-service'

export async function GET(request: Request): Promise<Response> {
  const refId = new URL(request.url).searchParams.get('refId')
  if (!refId) {
    return Response.redirect(siteUrl('/'), 302)
  }

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'transactions',
    where: { uuid: { equals: refId } },
    limit: 1,
    overrideAccess: true,
  })
  const txn = docs[0] as { order: number | { id: number } } | undefined
  if (!txn) {
    return Response.redirect(siteUrl('/'), 302)
  }

  try {
    await resolveBenefitPlusPayment(refId)
  } catch (err) {
    console.error('[muzapay/return] status check failed; leaving it to the sweep:', err)
  }

  const orderId = typeof txn.order === 'object' ? txn.order.id : txn.order
  return Response.redirect(siteUrl(`/account/orders/${orderId}`), 302)
}
