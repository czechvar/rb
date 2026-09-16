import type { Payload } from 'payload'
import { resolveEmailMode } from '@/lib/email/adapter'
import { siteUrl } from '@/lib/url'
import type { CheckoutItem } from '@/lib/checkout/types'
import {
  checkoutInvitationEmail,
  checkoutPaymentTiming,
  checkoutVerificationEmail,
} from '@/lib/email/checkout-templates'

export function checkoutEmailAvailable(): boolean {
  return resolveEmailMode() !== 'console'
}

type NotificationStatus = 'sent' | 'failed' | 'notConfigured'

/** Codes are only delivered through the configured adapter, never console logs or action results. */
export async function sendCheckoutVerificationCode(
  payload: Payload,
  input: { email: string; code: string },
): Promise<NotificationStatus> {
  if (!checkoutEmailAvailable()) return 'notConfigured'
  try {
    const email = checkoutVerificationEmail({ code: input.code })
    await payload.sendEmail({
      to: input.email,
      ...email,
    })
    return 'sent'
  } catch {
    return 'failed'
  }
}

/** Invitation tokens stay in URL fragments and are never written to request logs. */
export async function sendCheckoutInvitationLink(
  payload: Payload,
  input: { id: number; reference: string; email: string; token: string; items: CheckoutItem[] },
): Promise<NotificationStatus> {
  if (!checkoutEmailAvailable()) return 'notConfigured'
  try {
    const url = siteUrl(
      `/checkout/invite?checkout=${input.id}#token=${encodeURIComponent(input.token)}`,
    )
    const items = await resolveInvitationLocations(payload, input.items)
    const email = checkoutInvitationEmail({
      url,
      reference: input.reference,
      items,
      paymentTiming: checkoutPaymentTiming(items),
    })
    await payload.sendEmail({
      to: input.email,
      ...email,
    })
    return 'sent'
  } catch {
    return 'failed'
  }
}

async function resolveInvitationLocations(
  payload: Payload,
  items: CheckoutItem[],
): Promise<CheckoutItem[]> {
  const missingIds = items.filter((item) => !item.location).map((item) => item.eventDateId)
  if (!missingIds.length) return items
  const dates = await payload.find({
    collection: 'event-dates',
    where: { id: { in: missingIds } },
    limit: missingIds.length,
    pagination: false,
    depth: 1,
    overrideAccess: true,
  })
  const locations = new Map(
    dates.docs.map((date) => [
      date.id,
      date.locations
        ?.flatMap((entry) => (typeof entry === 'object' && entry?.name ? [entry.name] : []))
        .join(', '),
    ]),
  )
  return items.map((item) => ({
    ...item,
    location: item.location || locations.get(item.eventDateId) || 'To be confirmed',
  }))
}
