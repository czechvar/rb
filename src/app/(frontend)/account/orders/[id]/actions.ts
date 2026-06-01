'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export async function cancelMyOrderAction(orderId: number | string): Promise<void> {
  const user = await requireUser()
  const payload = await getPayloadClient()
  await payload.update({
    collection: 'orders',
    id: orderId,
    data: { state: 'cancelled' },
    user, overrideAccess: false,
  })
  revalidatePath(`/account/orders/${orderId}`)
  revalidatePath('/account/orders')
}
