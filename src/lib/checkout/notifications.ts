import type { Payload } from 'payload'
import { resolveEmailMode } from '@/lib/email/adapter'
import { siteUrl } from '@/lib/url'

export function checkoutEmailAvailable(): boolean {
  return resolveEmailMode() !== 'console'
}

/** Tokens are only delivered through the configured adapter, never console logs or action results. */
export async function sendCheckoutLink(
  payload: Payload,
  input: { id: number; email: string; token: string; kind: 'verify' | 'invite' },
): Promise<'sent' | 'failed' | 'notConfigured'> {
  if (!checkoutEmailAvailable()) return 'notConfigured'
  try {
    const url = siteUrl(
      `/checkout/${input.kind}?checkout=${input.id}#token=${encodeURIComponent(input.token)}`,
    )
    await payload.sendEmail({
      to: input.email,
      subject:
        input.kind === 'verify'
          ? 'Confirm your Rockbusters checkout email'
          : 'Your Rockbusters checkout is approved',
      text:
        input.kind === 'verify'
          ? `Confirm your email to reserve your selected trips for staff review. Opening this link does not reserve seats; use the confirmation button on the page. The link expires in 24 hours.\n\n${url}\n\nIf you did not request this, ignore this message.`
          : `Your checkout has been approved. Use this link to set up your account or sign in to your existing account, then continue to payment. The link expires in 24 hours.\n\n${url}`,
    })
    return 'sent'
  } catch {
    return 'failed'
  }
}
