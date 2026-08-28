import { getPayloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/url'

export async function GET(request: Request): Promise<Response> {
  const refId = new URL(request.url).searchParams.get('refId')
  if (!refId) {
    return Response.redirect(siteUrl('/'), 302)
  }

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'transactions', where: { uuid: { equals: refId } }, limit: 1, overrideAccess: true,
  })
  const txn = docs[0] as { order: number | { id: number } } | undefined
  if (!txn) {
    return Response.redirect(siteUrl('/'), 302)
  }

  const orderId = typeof txn.order === 'object' ? txn.order.id : txn.order
  return Response.redirect(siteUrl(`/account/orders/${orderId}`), 302)
}
