import { isAdminUser } from '@/access'
import { randomUUID } from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'
import { sql } from 'drizzle-orm'
import { getPayloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/url'
import type { CheckoutMethod, CheckoutRecord } from '@/lib/checkout/types'
import { withCheckoutTransaction, lockCheckout, checkoutDatabase } from '@/lib/checkout/transaction'
import { cancelCheckoutInTransaction, validateCheckoutBilling } from '@/lib/checkout/reservations'
import { ComgateGateway } from './comgate/gateway'
import { comgateConfigFromEnv } from './comgate/config'
import { MuzaPayGateway } from './muzapay/gateway'
import { isBenefitPlusConfigured, muzapayConfigFromEnv } from './muzapay/config'
import type { PaymentGatewayFactory, PaymentOutcome } from './gateway'
import {
  PayloadTransactionStore,
  toGatewayTransaction,
  type TransactionDoc,
} from './transaction-store'
import {
  applyAllocations,
  assertMinor,
  isFullyPaid,
  paymentAllocations,
  sameAllocations,
  type PaymentPurpose,
} from './checkout-ledger'

export function availableCheckoutMethods(): { card: boolean; benefit: boolean } {
  return {
    card: Boolean(process.env.COMGATE_MERCHANT && process.env.COMGATE_SECRET),
    benefit: isBenefitPlusConfigured(),
  }
}
function gatewayFactory(): PaymentGatewayFactory {
  const shared = { backendBaseUrl: siteUrl(), store: new PayloadTransactionStore() }
  return (method) => {
    if (method === 'comgate-card')
      return new ComgateGateway({ ...comgateConfigFromEnv(), ...shared })
    if (method === 'muzapay') return new MuzaPayGateway({ ...muzapayConfigFromEnv(), ...shared })
    throw new Error('Unsupported checkout payment method.')
  }
}
const relatedId = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' && value ? value.id : value
const activeStates = ['created', 'begun', 'pending-payment']
interface PaymentInput {
  method: CheckoutMethod
  purpose: PaymentPurpose
  itemIds?: number[]
}
interface Dependencies {
  payload: Payload
  gateways: PaymentGatewayFactory
  now?: () => Date
  enabled?: () => boolean
}

/** Injected providers are used only by tests; all production entrypoints build their own adapters. */
export function createCheckoutPaymentService({
  payload,
  gateways,
  now = () => new Date(),
  enabled = () => process.env.CHECKOUT_ENABLED === 'true',
}: Dependencies) {
  const fetchCheckout = async (id: number, req: PayloadRequest) =>
    (await payload.findByID({
      collection: 'checkouts',
      id,
      depth: 0,
      overrideAccess: true,
      req,
    })) as unknown as CheckoutRecord
  const transactions = async (checkoutId: number, req?: PayloadRequest) => {
    const result = await payload.find({
      collection: 'transactions',
      where: { checkout: { equals: checkoutId } },
      limit: 0,
      pagination: false,
      depth: 0,
      overrideAccess: true,
      req,
    })
    return result.docs as unknown as TransactionDoc[]
  }
  const queue = async (checkout: CheckoutRecord, reason: string, req: PayloadRequest) => {
    await payload.update({
      collection: 'checkouts',
      id: checkout.id,
      data: { state: 'reconciliation', reconciliationReason: reason },
      req,
      overrideAccess: true,
    })
  }
  async function applyOutcome(uuid: string, outcome: PaymentOutcome): Promise<void> {
    const found = await payload.find({
      collection: 'transactions',
      where: { uuid: { equals: uuid } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const initial = found.docs[0] as unknown as TransactionDoc | undefined
    const checkoutId = relatedId(initial?.checkout)
    if (!initial || !checkoutId) throw new Error('Checkout transaction not found.')
    await withCheckoutTransaction(payload, async (req) => {
      await lockCheckout(req, checkoutId)
      await (
        await checkoutDatabase(req)
      ).execute(sql`SELECT pg_advisory_xact_lock(42003, ${initial.id})`)
      const txn = (await payload.findByID({
        collection: 'transactions',
        id: initial.id,
        depth: 0,
        req,
        overrideAccess: true,
      })) as unknown as TransactionDoc
      const checkout = await fetchCheckout(checkoutId, req)
      if (txn.settledAt || txn.state === 'paid') return
      if (outcome.state === 'paid') {
        const allocations = txn.allocations
        if (
          !allocations?.length ||
          allocations.reduce((total, item) => total + assertMinor(item.amountMinor), 0) !==
            txn.amountMinor
        ) {
          await queue(
            checkout,
            'Paid transaction has invalid allocations; staff reconciliation required.',
            req,
          )
          await payload.update({
            collection: 'transactions',
            id: txn.id,
            data: {
              state: 'paid',
              reconciliationReason: 'Invalid allocation ledger.',
              callbackPayload: outcome.callbackPayload,
            },
            req,
            overrideAccess: true,
          })
          return
        }
        const method = txn.paymentMethod as CheckoutMethod
        const ledger = applyAllocations(checkout.items, allocations, method)
        const late = ['cancelled', 'expired', 'reconciliation'].includes(checkout.state) ||
          allocations.some((allocation) => checkout.items.some((item) =>
            item.eventDateId === allocation.eventDateId && Boolean(item.cancelledAt)))
        const mismatch = Boolean(checkout.paymentMethod && checkout.paymentMethod !== method)
        const reason = late
          ? 'Payment received after reservation cancellation or while reconciliation is required.'
          : mismatch
            ? 'Payment received using a different settled method.'
            : ledger.overpaid
              ? 'Payment exceeds an item balance.'
              : null
        await payload.update({
          collection: 'checkouts',
          id: checkout.id,
          data: {
            items: ledger.items as never,
            paymentMethod: checkout.paymentMethod ?? method,
            expiresAt: null,
            ...(reason ? { state: 'reconciliation', reconciliationReason: reason } : {}),
          },
          req,
          overrideAccess: true,
        })
        if (!reason)
          for (const item of ledger.items) {
            if (!item.orderId || item.cancelledAt) continue
            const order = await payload.findByID({
              collection: 'orders',
              id: item.orderId,
              depth: 0,
              req,
              overrideAccess: true,
            })
            if (order.state === 'cancelled' || order.state === 'completed') continue
            if (order.state === 'pending')
              await payload.update({
                collection: 'orders',
                id: item.orderId,
                data: { state: 'confirmed' },
                req,
                overrideAccess: true,
              })
            if (isFullyPaid(item, method) && order.state !== 'paid')
              await payload.update({
                collection: 'orders',
                id: item.orderId,
                data: { state: 'paid' },
                req,
                overrideAccess: true,
              })
          }
        await payload.update({
          collection: 'transactions',
          id: txn.id,
          data: {
            state: 'paid',
            settledAt: now().toISOString(),
            callbackPayload: outcome.callbackPayload,
            ...(reason ? { reconciliationReason: reason } : {}),
          },
          req,
          overrideAccess: true,
        })
      } else if (['cancelled', 'failed', 'pending-payment'].includes(outcome.state)) {
        // A failed/cancelled attempt does not cancel the reserved seats.
        await payload.update({
          collection: 'transactions',
          id: txn.id,
          data: { state: outcome.state, callbackPayload: outcome.callbackPayload },
          req,
          overrideAccess: true,
        })
      }
    })
  }
  async function begin(
    checkoutId: number,
    user: { id: number; email: string },
    input: PaymentInput,
  ): Promise<{ redirectUrl: string }> {
    if (!enabled()) throw new Error('Checkout is not available.')
    if (!['comgate-card', 'muzapay'].includes(input.method))
      throw new Error('Unsupported payment method.')
    const gateway = gateways(input.method)
    const prepared = await withCheckoutTransaction(payload, async (req) => {
      await lockCheckout(req, checkoutId)
      const checkout = await fetchCheckout(checkoutId, req)
      if (relatedId(checkout.user) !== user.id)
        throw new Error('This checkout does not belong to you.')
      if (!['reserved', 'approved'].includes(checkout.state))
        throw new Error('This checkout cannot be paid yet.')
      if (checkout.expiresAt && new Date(checkout.expiresAt) <= now())
        throw new Error('This reservation requires an expiry check before payment.')
      validateCheckoutBilling(checkout.billingAddress)
      if (input.method === 'muzapay' && checkout.items.some((item) => !item.cancelledAt && item.totalCzkMinor === null))
        throw new Error('Benefit+ is unavailable for this basket.')
      const allocations = paymentAllocations(
        checkout,
        input.method,
        input.purpose,
        input.itemIds,
        now(),
      )
      const amountMinor = assertMinor(
        allocations.reduce((total, item) => total + item.amountMinor, 0),
      )
      if (!amountMinor) throw new Error('Nothing remains to pay for this selection.')
      const outstanding = (await transactions(checkout.id, req)).find((txn) =>
        activeStates.includes(txn.state),
      )
      if (outstanding) {
        if (
          outstanding.state === 'begun' &&
          outstanding.paymentMethod === input.method &&
          outstanding.purpose === input.purpose &&
          sameAllocations(outstanding.allocations, allocations) &&
          typeof outstanding.payload?.redirectUrl === 'string'
        )
          return {
            txn: outstanding,
            resume: true,
            payerName: checkout.contact.name,
            billingAddress: checkout.billingAddress,
          }
        throw new Error(
          'An earlier payment is still being checked. Finish it before starting another.',
        )
      }
      const amountWithoutVat =
        allocations.reduce((total, allocation) => {
          const item = checkout.items.find((row) => row.eventDateId === allocation.eventDateId)!
          return total + Math.round(allocation.amountMinor / (1 + item.vat / 100))
        }, 0) / 100
      const txn = (await payload.create({
        collection: 'transactions',
        data: {
          uuid: randomUUID(),
          checkout: checkout.id,
          amountMinor,
          amount: amountMinor / 100,
          amountWithoutVat,
          currency: input.method === 'muzapay' ? 'CZK' : checkout.currency,
          allocations: allocations as never,
          purpose: input.purpose,
          label: `Rockbusters ${checkout.reference}`,
          orderReference: checkout.reference,
          email: checkout.contact.email,
          state: 'created',
          paymentMethod: input.method,
        },
        req,
        overrideAccess: true,
      })) as unknown as TransactionDoc
      return {
        txn,
        resume: false,
        payerName: checkout.contact.name,
        billingAddress: checkout.billingAddress,
      }
    })
    if (prepared.resume) return { redirectUrl: prepared.txn.payload!.redirectUrl as string }
    try {
      const result = await gateway.begin({
        ...toGatewayTransaction(prepared.txn),
        payerName: prepared.payerName,
        billingAddress: prepared.billingAddress ?? undefined,
      })
      if (new URL(result.redirectUrl).protocol !== 'https:')
        throw new Error('Invalid payment redirect.')
      await withCheckoutTransaction(payload, async (req) => {
        await lockCheckout(req, checkoutId)
        const fresh = await payload.findByID({
          collection: 'transactions',
          id: prepared.txn.id,
          depth: 0,
          req,
          overrideAccess: true,
        })
        await payload.update({
          collection: 'transactions',
          id: prepared.txn.id,
          data: {
            ...(fresh.state === 'created' ? { state: 'begun' } : {}),
            payload: result.payload,
          },
          req,
          overrideAccess: true,
        })
      })
      return { redirectUrl: result.redirectUrl }
    } catch {
      await withCheckoutTransaction(payload, async (req) => {
        await lockCheckout(req, checkoutId)
        const checkout = await fetchCheckout(checkoutId, req)
        await queue(
          checkout,
          'Payment initiation result is uncertain. Check the provider before another attempt.',
          req,
        )
      })
      throw new Error(
        'Payment could not be confirmed. Your reservation is retained for staff review.',
      )
    }
  }
  async function reconcile(uuid: string): Promise<void> {
    const found = await payload.find({
      collection: 'transactions',
      where: { uuid: { equals: uuid } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const txn = found.docs[0] as unknown as TransactionDoc | undefined
    if (!txn?.checkout || txn.settledAt) return
    const outcome = await gateways(txn.paymentMethod).checkStatus(toGatewayTransaction(txn))
    if (outcome) await applyOutcome(uuid, outcome)
  }
  async function expire(checkoutId: number): Promise<void> {
    // Close admission to new payment attempts before any provider roundtrip.
    const pending = await withCheckoutTransaction(payload, async (req) => {
      await lockCheckout(req, checkoutId)
      const checkout = await fetchCheckout(checkoutId, req)
      if (
        !checkout.expiresAt ||
        new Date(checkout.expiresAt) > now() ||
        !['reserved', 'approved', 'reconciliation'].includes(checkout.state)
      )
        return null
      if (checkout.items.some((item) => item.paidMinor > 0 || item.paidCzkMinor > 0)) return null
      await queue(checkout, 'Reservation expiry: awaiting definitive payment reconciliation.', req)
      return transactions(checkout.id, req)
    })
    if (!pending) return
    let uncertain = false
    for (const txn of pending) {
      if (txn.settledAt || ['cancelled', 'failed'].includes(txn.state)) continue
      if (!txn.payload?.gatewayTransactionId) {
        uncertain = true
        continue
      }
      try {
        const gateway = gateways(txn.paymentMethod)
        let result = await gateway.checkStatus(toGatewayTransaction(txn))
        if (
          !result &&
          (txn.cancelAttempts ?? 0) < 3 &&
          (!txn.lastCancelAttemptAt ||
            now().getTime() - new Date(txn.lastCancelAttemptAt).getTime() >= 10 * 60 * 1000)
        ) {
          const claimed = await withCheckoutTransaction(payload, async (req) => {
            await lockCheckout(req, checkoutId)
            const current = (await payload.findByID({
              collection: 'transactions',
              id: txn.id,
              depth: 0,
              req,
              overrideAccess: true,
            })) as unknown as TransactionDoc
            if (
              current.settledAt ||
              (current.cancelAttempts ?? 0) >= 3 ||
              (current.lastCancelAttemptAt &&
                now().getTime() - new Date(current.lastCancelAttemptAt).getTime() < 10 * 60 * 1000)
            )
              return false
            await payload.update({
              collection: 'transactions',
              id: txn.id,
              data: {
                cancelAttempts: (current.cancelAttempts ?? 0) + 1,
                lastCancelAttemptAt: now().toISOString(),
              },
              req,
              overrideAccess: true,
            })
            return true
          })
          if (claimed) result = await gateway.cancel(toGatewayTransaction(txn))
        }
        if (result) await applyOutcome(txn.uuid, result)
        else uncertain = true
      } catch {
        uncertain = true
      }
    }
    await withCheckoutTransaction(payload, async (req) => {
      await lockCheckout(req, checkoutId)
      const checkout = await fetchCheckout(checkoutId, req)
      if (checkout.items.some((item) => item.paidMinor > 0 || item.paidCzkMinor > 0)) return
      const attempts = await transactions(checkoutId, req)
      if (uncertain || attempts.some((txn) => !['cancelled', 'failed'].includes(txn.state))) {
        await queue(
          checkout,
          'Reservation expiry could not confirm all payment attempts. Staff must reconcile.',
          req,
        )
        return
      }
      await cancelCheckoutInTransaction(
        req,
        checkout,
        'Unpaid reservation expired after gateway reconciliation.',
        'expired',
      )
    })
  }
  async function cancelPaid(
    checkoutId: number,
    actor: { id: number; role?: unknown },
    reason: string,
    itemIds?: number[],
  ): Promise<void> {
    if (!isAdminUser(actor) || !reason.trim())
      throw new Error('Staff and a cancellation reason are required.')
    await withCheckoutTransaction(payload, async (req) => {
      await lockCheckout(req, checkoutId)
      const checkout = await fetchCheckout(checkoutId, req)
      if ((await transactions(checkoutId, req)).some((txn) => activeStates.includes(txn.state)))
        throw new Error('Reconcile pending payment attempts before cancelling.')
      await cancelCheckoutInTransaction(
        req,
        checkout,
        `${reason.trim()} Refund handling remains manual; consult payment receipts.`,
        'cancelled',
        itemIds,
      )
    })
  }
  async function recordRefund(
    uuid: string,
    actor: { id: number; role?: unknown },
    providerReference: string,
    allocations: import('./checkout-ledger').PaymentAllocation[],
  ): Promise<void> {
    if (
      !isAdminUser(actor) ||
      !providerReference.trim() ||
      providerReference.length > 200 ||
      !allocations.length
    )
      throw new Error('Staff, a provider refund receipt and allocations are required.')
    const found = await payload.find({
      collection: 'transactions',
      where: { uuid: { equals: uuid } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const initial = found.docs[0] as unknown as TransactionDoc | undefined
    const checkoutId = relatedId(initial?.checkout)
    if (!initial || !checkoutId) throw new Error('Checkout transaction not found.')
    await withCheckoutTransaction(payload, async (req) => {
      await lockCheckout(req, checkoutId)
      const txn = (await payload.findByID({
        collection: 'transactions',
        id: initial.id,
        depth: 0,
        req,
        overrideAccess: true,
      })) as unknown as TransactionDoc
      if (txn.state !== 'paid' || !txn.settledAt)
        throw new Error('Only reconciled paid transactions can have refunds recorded.')
      const refunds = txn.refunds ?? []
      const receipt = refunds.find(
        (refund) => refund.providerReference === providerReference.trim(),
      )
      if (receipt) {
        if (!sameAllocations(receipt.allocations, allocations))
          throw new Error('Refund receipt already has different allocations.')
        return
      }
      const checkout = await fetchCheckout(checkoutId, req)
      const items = checkout.items.map((item) => ({ ...item }))
      const seen = new Set<number>()
      for (const allocation of allocations) {
        if (seen.has(allocation.eventDateId)) throw new Error('Duplicate refund allocation.')
        seen.add(allocation.eventDateId)
        const amount = assertMinor(allocation.amountMinor)
        if (!amount) throw new Error('Refund amount must be positive.')
        const original = txn.allocations?.find(
          (item) =>
            item.eventDateId === allocation.eventDateId && item.orderId === allocation.orderId,
        )
        const already = refunds
          .flatMap((refund) => refund.allocations)
          .filter((item) => item.eventDateId === allocation.eventDateId)
          .reduce((total, item) => total + item.amountMinor, 0)
        const item = items.find(
          (item) =>
            item.eventDateId === allocation.eventDateId && item.orderId === allocation.orderId,
        )
        if (!original || !item || already + amount > original.amountMinor)
          throw new Error('Refund exceeds the settled transaction allocation.')
        if (txn.paymentMethod === 'muzapay')
          item.refundedCzkMinor = assertMinor(item.refundedCzkMinor + amount)
        else item.refundedMinor = assertMinor(item.refundedMinor + amount)
      }
      await payload.update({
        collection: 'transactions',
        id: txn.id,
        data: {
          refunds: [
            ...refunds,
            {
              providerReference: providerReference.trim(),
              recordedAt: now().toISOString(),
              recordedBy: actor.id,
              allocations,
            },
          ] as never,
        },
        req,
        overrideAccess: true,
      })
      await payload.update({
        collection: 'checkouts',
        id: checkoutId,
        data: {
          items: items as never,
          reconciliationReason:
            'Staff recorded a provider refund receipt; no automatic refund was issued.',
        },
        req,
        overrideAccess: true,
      })
    })
  }
  return { begin, applyOutcome, reconcile, expire, cancelPaid, recordRefund }
}
async function service() {
  return createCheckoutPaymentService({
    payload: await getPayloadClient(),
    gateways: gatewayFactory(),
  })
}
export async function beginCheckoutPayment(
  checkoutId: number,
  user: { id: number; email: string },
  input: PaymentInput,
) {
  return (await service()).begin(checkoutId, user, input)
}
export async function applyCheckoutPaymentOutcome(uuid: string, outcome: PaymentOutcome) {
  return (await service()).applyOutcome(uuid, outcome)
}
export async function reconcileCheckoutPayment(uuid: string) {
  return (await service()).reconcile(uuid)
}
export async function reconcileCheckoutExpiry(checkoutId: number) {
  return (await service()).expire(checkoutId)
}
export async function sweepCheckoutPayments(): Promise<{ checked: number; failed: number }> {
  const payload = await getPayloadClient()
  const payments = await service()
  const result = { checked: 0, failed: 0 }
  const pending = await payload.find({
    collection: 'transactions',
    where: { and: [{ checkout: { exists: true } }, { state: { in: activeStates } }] },
    sort: 'createdAt',
    limit: 100,
    overrideAccess: true,
  })
  for (const txn of pending.docs) {
    result.checked++
    try {
      await payments.reconcile(txn.uuid)
    } catch {
      result.failed++
    }
  }
  const expired = await payload.find({
    collection: 'checkouts',
    where: {
      and: [
        { state: { in: ['reserved', 'approved', 'reconciliation'] } },
        { expiresAt: { less_than_equal: new Date().toISOString() } },
      ],
    },
    sort: 'expiresAt',
    limit: 100,
    overrideAccess: true,
  })
  for (const checkout of expired.docs) {
    result.checked++
    try {
      await payments.expire(checkout.id)
    } catch {
      result.failed++
    }
  }
  return result
}

export async function cancelPaidCheckout(
  checkoutId: number,
  actor: { id: number; role?: unknown },
  reason: string,
  itemIds?: number[],
) {
  return (await service()).cancelPaid(checkoutId, actor, reason, itemIds)
}
export async function recordCheckoutRefund(
  uuid: string,
  actor: { id: number; role?: unknown },
  providerReference: string,
  allocations: import('./checkout-ledger').PaymentAllocation[],
) {
  return (await service()).recordRefund(uuid, actor, providerReference, allocations)
}
