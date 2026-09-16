import type { Payload } from 'payload'
import { resolveEmailMode } from '@/lib/email/adapter'
import { siteUrl } from '@/lib/url'

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
    await payload.sendEmail({
      to: input.email,
      subject: 'Your Rockbusters checkout verification code',
      text: `Enter this code in checkout to reserve your selected trips for staff review:\n\n${input.code}\n\nThe code expires in 10 minutes. No seats are reserved until the code is accepted. If you did not request this, ignore this message.`,
    })
    return 'sent'
  } catch {
    return 'failed'
  }
}

/** Invitation tokens stay in URL fragments and are never written to request logs. */
export async function sendCheckoutInvitationLink(
  payload: Payload,
  input: { id: number; email: string; token: string },
): Promise<NotificationStatus> {
  if (!checkoutEmailAvailable()) return 'notConfigured'
  try {
    const url = siteUrl(
      `/checkout/invite?checkout=${input.id}#token=${encodeURIComponent(input.token)}`,
    )
    await payload.sendEmail({
      to: input.email,
      subject: 'Your Rockbusters checkout is approved',
      text: `Your checkout has been approved. Use this link to set up your account or sign in to your existing account, then continue to payment. The link expires in 24 hours.\n\n${url}`,
    })
    return 'sent'
  } catch {
    return 'failed'
  }
}
