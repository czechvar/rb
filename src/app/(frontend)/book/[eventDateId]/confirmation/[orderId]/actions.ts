'use server'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import {
  beginComgatePayment,
  beginBenefitPlusPayment,
} from '@/payments/order-payment-service'

export async function payByCardAction(orderId: number): Promise<void> {
  const user = await requireUser()
  const { redirectUrl } = await beginComgatePayment(orderId, { id: user.id, email: user.email })
  redirect(redirectUrl)
}

export async function payWithBenefitPlusAction(orderId: number): Promise<void> {
  const user = await requireUser()
  const { redirectUrl } = await beginBenefitPlusPayment(orderId, {
    id: user.id,
    email: user.email,
  })
  redirect(redirectUrl)
}
