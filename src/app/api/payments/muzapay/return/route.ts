/**
 * Where the payer's browser lands after the Benefit+ gateway. Benefit+ sends
 * no webhook, so this is the first chance to learn the result — but the
 * redirect itself proves nothing, so the state is read from the gateway.
 *
 * Identifying the transaction: we append our own `refId` (the transaction
 * uuid) to the return URL, but Benefit+'s documented contract is that it
 * calls the return URL with a `paymentId` query parameter of its own
 * ("you must implement an endpoint accepting the GET method with the
 * paymentId query parameter" — Benefit+ Parameters docs). Whether it
 * preserves our query string alongside that is not documented, so we accept
 * either: `refId` first, then `paymentId`. Without the fallback, a stripped
 * query string would strand every payer on the homepage.
 *
 * This route never shows the payer an error: if the status check fails, the
 * cron sweep will resolve the payment shortly, and the order page they land
 * on shows the current truth either way.
 */

import { siteUrl } from '@/lib/url'
import { resolveBenefitPlusPayment } from '@/payments/order-payment-service'
import { PayloadTransactionStore, type TransactionDoc } from '@/payments/transaction-store'

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  const refId = params.get('refId')
  const paymentId = params.get('paymentId')

  const store = new PayloadTransactionStore()
  let txn: TransactionDoc | null = null
  if (refId) {
    txn = await store.findDocByUuid(refId)
  }
  if (!txn && paymentId) {
    txn = await store.findDocByGatewayTransactionId(paymentId)
  }
  if (!txn) {
    return Response.redirect(siteUrl('/'), 302)
  }

  try {
    await resolveBenefitPlusPayment(txn.uuid)
  } catch (err) {
    console.error('[muzapay/return] status check failed; leaving it to the sweep:', err)
  }

  const orderId = typeof txn.order === 'object' ? txn.order.id : txn.order
  return Response.redirect(siteUrl(`/account/orders/${orderId}`), 302)
}
