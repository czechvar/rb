/**
 * Payload-backed persistence for `transactions`. Split out of
 * order-payment-service.ts so both gateways can share it: Comgate resolves
 * through a webhook, Benefit+ through polling, but both need the same lookups
 * and the same domain mapping.
 */

import { getPayloadClient } from '@/lib/payload'
import type {
  Transaction as GatewayTransaction,
  TransactionState,
  PaymentMethod,
  TransactionStore,
} from './gateway'

export type Currency = 'EUR' | 'CZK'
export type OrderState = 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled'

// OrderDoc/TransactionDoc below are hand-narrowed subsets of the generated Payload
// types, not a verified 1:1 mirror of payload-types.ts — e.g. `orderNumber` is
// treated as always-present because `allocateOrderNumber` sets it on create, and
// `payload`/`callbackPayload` are narrowed to object-only because nothing but the
// payment modules ever writes them.
export interface OrderDoc {
  id: number
  orderNumber: string
  state: OrderState
  totalPrice: number
  totalPriceCzk?: number | null
  vat: number
  currency: Currency
  user: number | { id: number; email: string }
}

export interface TransactionDoc {
  id: number
  uuid: string
  order: number | { id: number }
  amount: number
  amountWithoutVat: number
  currency: Currency
  label: string
  orderReference?: string | null
  email: string
  state: TransactionState
  paymentMethod: PaymentMethod
  payload: Record<string, unknown> | null
  callbackPayload: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export function toGatewayTransaction(doc: TransactionDoc): GatewayTransaction {
  return {
    id: String(doc.id),
    uuid: doc.uuid,
    money: {
      amount: doc.amount.toFixed(2),
      amountWithoutVat: doc.amountWithoutVat.toFixed(2),
      currency: doc.currency,
    },
    label: doc.label,
    orderReference: doc.orderReference ?? undefined,
    email: doc.email,
    state: doc.state,
    paymentMethod: doc.paymentMethod,
    payload: doc.payload ?? {},
    callbackPayload: doc.callbackPayload,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export class PayloadTransactionStore implements TransactionStore {
  /**
   * The raw Payload document, which the service layer needs (it writes back
   * by numeric id). `findByUuid` below is the narrowed domain view the
   * `TransactionStore` port promises to gateways.
   */
  async findDocByUuid(uuid: string): Promise<TransactionDoc | null> {
    const cms = await getPayloadClient()
    const { docs } = await cms.find({
      collection: 'transactions',
      where: { uuid: { equals: uuid } },
      limit: 1,
      overrideAccess: true,
    })
    return (docs[0] as TransactionDoc | undefined) ?? null
  }

  async findByUuid(uuid: string): Promise<GatewayTransaction | null> {
    const doc = await this.findDocByUuid(uuid)
    return doc ? toGatewayTransaction(doc) : null
  }

  async findByGatewayTransactionId(
    gatewayTransactionId: string,
  ): Promise<GatewayTransaction | null> {
    const cms = await getPayloadClient()
    const { docs } = await cms.find({
      collection: 'transactions',
      where: { 'payload.gatewayTransactionId': { equals: gatewayTransactionId } },
      limit: 1,
      overrideAccess: true,
    })
    const doc = docs[0] as TransactionDoc | undefined
    return doc ? toGatewayTransaction(doc) : null
  }
}
