'use server'

import { headers } from 'next/headers'
import type { ActionResult } from '@/components/forms/action-result'
import { setPayloadSession } from '@/lib/auth-session'
import { contactNetwork } from '@/lib/contact/intake'
import {
  createGuestCheckout,
  verifyGuestCheckout,
  acceptCheckoutInvitation,
  invitationKind,
  lookupCheckoutJourney,
} from '@/lib/checkout/identity'

async function network() {
  return contactNetwork(await headers(), process.env.VERCEL === '1')
}
type ActionFailure = Extract<ActionResult, { ok: false }>
export type CreateGuestCheckoutActionResult = { ok: true; checkoutId: number } | ActionFailure
const error = (formError: string): ActionFailure => ({ ok: false, formError })

export async function lookupCheckoutJourneyAction(
  email: string,
): Promise<{ ok: true; journey: 'login' | 'new' } | { ok: false; error: string }> {
  try {
    return { ok: true, journey: await lookupCheckoutJourney(email, await network()) }
  } catch {
    return {
      ok: false,
      error:
        'We could not check this email. Enter a valid address, or wait ten minutes before trying again.',
    }
  }
}

export async function checkoutInvitationKindAction(
  id: number,
  token: string,
): Promise<import('@/lib/checkout/identity').CheckoutInvitationState> {
  try {
    if (!Number.isSafeInteger(id) || id <= 0 || !/^[A-Za-z0-9_-]{43}$/.test(token))
      return { kind: 'invalid' }
    const { getCurrentUser } = await import('@/lib/auth')
    return await invitationKind(id, token, await getCurrentUser())
  } catch {
    return { kind: 'invalid' }
  }
}

export async function createGuestCheckoutAction(
  _previous: ActionResult | null,
  data: FormData,
): Promise<CreateGuestCheckoutActionResult> {
  if (data.get('website')) return error('Unable to start checkout. Please contact us directly.')
  try {
    const items = data.get('items')
    if (typeof items !== 'string' || items.length > 10000)
      return error('Check the trips in your cart.')
    const checkoutId = await createGuestCheckout(
      {
        submissionKey: data.get('submissionKey'),
        contact: { name: data.get('name'), email: data.get('email'), phone: data.get('phone') },
        items: JSON.parse(items),
        discountCode: data.get('discountCode') || undefined,
        referralCode: data.get('referralCode') || undefined,
      },
      await network(),
    )
    return { ok: true, checkoutId }
  } catch {
    return error(
      'We could not send the verification email. Check your details and cart, then try again in ten minutes or contact us directly. No seats have been reserved.',
    )
  }
}

export async function verifyGuestCheckoutAction(
  _previous: ActionResult | null,
  data: FormData,
): Promise<ActionResult> {
  try {
    await verifyGuestCheckout(
      Number(data.get('checkout')),
      String(data.get('code') || data.get('token') || ''),
      await network(),
    )
    return { ok: true }
  } catch {
    return error(
      'This confirmation could not be completed. The code may have expired or availability may have changed. Please restart checkout or contact us directly.',
    )
  }
}

export async function acceptCheckoutInvitationAction(
  _previous: ActionResult | null,
  data: FormData,
): Promise<ActionResult> {
  try {
    const { getCurrentUser } = await import('@/lib/auth')
    const user = await getCurrentUser()
    const name = String(data.get('name') ?? '').trim()
    const password = String(data.get('password') ?? '')
    if (password !== String(data.get('passwordConfirm') ?? ''))
      return error('Passwords do not match.')
    const id = Number(data.get('checkout'))
    if (!user && (name.length < 2 || name.length > 100))
      return { ok: false, fieldErrors: { name: 'Enter your full name.' }, values: { name } }
    const accepted = await acceptCheckoutInvitation(
      id,
      String(data.get('token') ?? ''),
      { name, password },
      user,
      await network(),
    )
    if (accepted.created) {
      try {
        const { getPayloadClient } = await import('@/lib/payload')
        const result = await (
          await getPayloadClient()
        ).login({
          collection: 'users',
          data: { email: accepted.email, password },
        })
        if (!result.token) throw new Error('Account session was not created.')
        await setPayloadSession(result.token)
      } catch {
        const paymentPath = `/account/checkouts/${id}#payment`
        return { ok: true, redirect: `/login?from=${encodeURIComponent(paymentPath)}` }
      }
    }
    return {
      ok: true,
      redirect: `/account/checkouts/${id}#payment`,
    }
  } catch {
    return error(
      'This invitation could not be accepted. Check the link and account, or ask our team for a new invitation.',
    )
  }
}
