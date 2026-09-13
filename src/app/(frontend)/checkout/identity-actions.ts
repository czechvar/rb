'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/components/forms/action-result'
import { contactNetwork } from '@/lib/contact/intake'
import {
  createGuestCheckout,
  verifyGuestCheckout,
  reviewGuestCheckout,
  acceptCheckoutInvitation,
  invitationKind,
  lookupCheckoutJourney,
} from '@/lib/checkout/identity'

async function network() {
  return contactNetwork(await headers(), process.env.VERCEL === '1')
}
const error = (formError: string): ActionResult => ({ ok: false, formError })

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
): Promise<'create' | 'login' | 'continue' | 'invalid'> {
  try {
    if (!Number.isSafeInteger(id) || id <= 0 || !/^[A-Za-z0-9_-]{43}$/.test(token)) return 'invalid'
    const { getCurrentUser } = await import('@/lib/auth')
    return await invitationKind(id, token, await getCurrentUser())
  } catch {
    return 'invalid'
  }
}

export async function createGuestCheckoutAction(
  _previous: ActionResult | null,
  data: FormData,
): Promise<ActionResult> {
  if (data.get('website')) return error('Unable to start checkout. Please contact us directly.')
  try {
    const items = data.get('items')
    if (typeof items !== 'string' || items.length > 10000)
      return error('Check the trips in your cart.')
    await createGuestCheckout(
      {
        submissionKey: data.get('submissionKey'),
        contact: { name: data.get('name'), email: data.get('email'), phone: data.get('phone') },
        items: JSON.parse(items),
        discountCode: data.get('discountCode') || undefined,
        referralCode: data.get('referralCode') || undefined,
      },
      await network(),
    )
    return { ok: true, redirect: '/checkout/check-email' }
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
      String(data.get('token') ?? ''),
      await network(),
    )
    return { ok: true }
  } catch {
    return error(
      'This confirmation could not be completed. The link may have expired or availability may have changed. Please start a new checkout or contact us directly.',
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
    const password = String(data.get('password') ?? '')
    if (password !== String(data.get('passwordConfirm') ?? ''))
      return error('Passwords do not match.')
    const id = Number(data.get('checkout'))
    await acceptCheckoutInvitation(
      id,
      String(data.get('token') ?? ''),
      password,
      user,
      await network(),
    )
    return {
      ok: true,
      redirect: user
        ? `/account/checkouts/${id}`
        : `/login?from=${encodeURIComponent(`/account/checkouts/${id}`)}`,
    }
  } catch {
    return error(
      'This invitation could not be accepted. Check the link and account, or ask our team for a new invitation.',
    )
  }
}

export async function reviewGuestCheckoutAction(
  _previous: ActionResult | null,
  data: FormData,
): Promise<ActionResult> {
  try {
    const { requireUser } = await import('@/lib/auth')
    const decision = data.get('decision')
    if (decision !== 'approve' && decision !== 'decline') return error('Choose approve or decline.')
    await reviewGuestCheckout(
      Number(data.get('checkout')),
      await requireUser(),
      decision,
      String(data.get('note') ?? ''),
    )
    revalidatePath('/checkout/review')
    return { ok: true }
  } catch {
    return error(
      'The review could not be fully completed. Refresh the checkout status before retrying; an approval may have saved even if its invitation email failed.',
    )
  }
}
