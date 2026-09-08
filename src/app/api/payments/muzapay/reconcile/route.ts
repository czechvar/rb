/**
 * Cron entry point for the Benefit+ reconciliation sweep. Benefit+ sends no
 * webhook, so this is what closes out payments whose payer never came back
 * through the return URL.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on scheduled
 * invocations; nothing else may run this, since it drives order state.
 */

import { sweepBenefitPlusPayments } from '@/payments/order-payment-service'

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Fail closed: an unset secret must not leave the endpoint open.
    return new Response('Not configured', { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const summary = await sweepBenefitPlusPayments()
  return Response.json(summary)
}
