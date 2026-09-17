'use server'

import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth'
import { checkoutEnabled } from '@/lib/checkout/feature'
import { quoteCart } from '@/lib/checkout/quote'
import {
  cancelCheckout,
  reserveCheckout,
  reserveCheckoutForReview,
  updateCheckoutBilling,
} from '@/lib/checkout/reservations'
import { beginCheckoutPayment } from '@/payments/checkout-payment-service'
import { REFERRAL_COOKIE_NAME } from '@/lib/referral'
import type { ActionResult } from '@/components/forms/action-result'
import { checkoutDisplayItem, type CheckoutDisplayQuote } from '@/components/checkout/presentation'
import type { CheckoutIntent, QuoteInput } from '@/lib/checkout/types'

const unavailable = {
  ok: false as const,
  formError: 'Checkout is currently unavailable. Please contact us directly.',
}
async function referral() {
  return (await cookies()).get(REFERRAL_COOKIE_NAME)?.value
}

export async function quoteCartAction(
  input: QuoteInput,
): Promise<{ ok: true; quote: CheckoutDisplayQuote } | { ok: false; error: string }> {
  if (!checkoutEnabled()) return { ok: false, error: 'Checkout is currently unavailable.' }
  try {
    const quote = await quoteCart({
      items: input.items,
      discountCode: input.discountCode,
      referralCode: await referral(),
    })
    return {
      ok: true,
      quote: {
        currency: quote.currency,
        totalMinor: quote.totalMinor,
        initialMinor: quote.initialMinor,
        benefitEligible: quote.benefitEligible,
        items: quote.items.map(checkoutDisplayItem),
      },
    }
  } catch {
    return {
      ok: false,
      error:
        'These selections could not be priced. Check your dates, quantities and discount code, or contact us for help.',
    }
  }
}

async function reserveAction(
  data: FormData,
  intent: CheckoutIntent,
): Promise<ActionResult> {
  if (!checkoutEnabled()) return unavailable
  try {
    const user = await getCurrentUser()
    if (!user) return { ok: false, formError: 'Please log in again before reserving your trips.' }
    const savedAddress = user.addresses?.find((entry) => entry.isDefault) || user.addresses?.[0]
    const checkout = await (intent === 'reserve' ? reserveCheckoutForReview : reserveCheckout)(
      {
        submissionKey: String(data.get('submissionKey') ?? ''),
        contact: {
          name: user.name,
          email: user.email,
          phone: user.phone || '',
        },
        items: JSON.parse(String(data.get('items') ?? '[]')),
        billingAddress: savedAddress
          ? {
              firstName: savedAddress.firstName,
              lastName: savedAddress.lastName,
              street: savedAddress.street,
              city: savedAddress.city,
              postalCode: savedAddress.postalCode,
              country: savedAddress.country,
              companyName: savedAddress.company?.companyName || '',
              ico: savedAddress.company?.ico || '',
              dic: savedAddress.company?.dic || '',
            }
          : undefined,
        discountCode: String(data.get('discountCode') ?? ''),
        referralCode: await referral(),
      },
      user,
    )
    return { ok: true, redirect: `/account/checkouts/${checkout.id}` }
  } catch {
    return {
      ok: false,
      formError:
        'We could not reserve the whole cart. Check availability and your details, then try again.',
    }
  }
}

export async function reserveCheckoutAction(
  _previous: ActionResult | null,
  data: FormData,
): Promise<ActionResult> {
  return reserveAction(data, 'pay')
}

export async function reserveCheckoutForReviewAction(
  _previous: ActionResult | null,
  data: FormData,
): Promise<ActionResult> {
  return reserveAction(data, 'reserve')
}

export async function payCheckoutAction(
  _previous: ActionResult | null,
  data: FormData,
): Promise<ActionResult> {
  if (!checkoutEnabled()) return unavailable
  try {
    const user = await getCurrentUser()
    if (!user) return { ok: false, formError: 'Please log in again.' }
    const method = data.get('method')
    const purpose = data.get('purpose')
    if (
      (method !== 'comgate-card' && method !== 'muzapay') ||
      (purpose !== 'full' && purpose !== 'deposit' && purpose !== 'balance')
    )
      return { ok: false, formError: 'Select a payment option.' }
    const itemIds =
      purpose === 'balance' ? data.getAll('itemIds').map((value) => Number(value)) : undefined
    if (itemIds && (!itemIds.length || itemIds.some((id) => !Number.isSafeInteger(id) || id <= 0)))
      return { ok: false, formError: 'Select at least one trip balance.' }
    const result = await beginCheckoutPayment(Number(data.get('checkoutId')), user, {
      method,
      purpose,
      itemIds,
    })
    const target = new URL(result.redirectUrl)
    if (target.protocol !== 'https:') throw new Error('Invalid payment destination')
    return { ok: true, redirect: target.href }
  } catch {
    return {
      ok: false,
      formError:
        'Payment could not be started. Your reservation is unchanged. Please retry or contact us.',
    }
  }
}

export async function cancelCheckoutAction(
  _previous: ActionResult | null,
  data: FormData,
): Promise<ActionResult> {
  if (!checkoutEnabled()) return unavailable
  try {
    const user = await getCurrentUser()
    if (!user) return { ok: false, formError: 'Please log in again.' }
    await cancelCheckout(Number(data.get('checkoutId')), user, 'Cancelled by purchaser')
    return { ok: true }
  } catch {
    return {
      ok: false,
      formError: 'This reservation could not be cancelled automatically. Please contact us.',
    }
  }
}

export async function saveCheckoutBillingAction(
  _previous: ActionResult | null,
  data: FormData,
): Promise<ActionResult> {
  if (!checkoutEnabled()) return unavailable
  try {
    const user = await getCurrentUser()
    if (!user) return { ok: false, formError: 'Please log in again.' }
    const address = Object.fromEntries(
      ['firstName', 'lastName', 'street', 'city', 'postalCode', 'country'].map((name) => [
        name,
        data.get(name) ?? '',
      ]),
    )
    await updateCheckoutBilling(Number(data.get('checkoutId')), user, address)
    return { ok: true }
  } catch {
    return { ok: false, formError: 'Complete your payer address and try again.' }
  }
}
