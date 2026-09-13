/**
 * TypeScript port of snowbusters
 * api/app/PaymentsModule/service/ComgateGateway.php.
 *
 * Status and pending-payment cancellation follow the current Comgate HTTP POST API.
 * Cancellation is never used as a refund of paid funds. handleReturn() is a no-op in the PHP
 * original too: Comgate confirms payment via server-to-server webhook only,
 * the return URL is purely where the payer's browser lands.
 */

import {
  isPaymentResult,
  PaymentGatewayError,
  type BeginResult,
  type PaymentGateway,
  type PaymentOutcome,
  type Transaction,
  type TransactionStore,
  type WebhookResult,
} from '../gateway'
import { comgatePostForm } from './client'
import { toMinorUnits } from '../money'

const API_BASE = 'https://payments.comgate.cz'

export interface ComgateGatewayConfig {
  merchant: string
  secret: string
  test: boolean
  /** Public base URL of this Next.js app (both the webhook and the API live here). */
  backendBaseUrl: string
  store: TransactionStore
}

export class ComgateGateway implements PaymentGateway {
  constructor(private readonly config: ComgateGatewayConfig) {}

  async begin(transaction: Transaction): Promise<BeginResult> {
    if (transaction.state !== 'created') {
      throw new PaymentGatewayError('Cannot begin the transaction at this point.')
    }

    const base = this.config.backendBaseUrl.replace(/\/+$/, '')
    const returnUrl = `${base}/api/payments/comgate/return?refId=${transaction.uuid}`
    const notifyUrl = `${base}/api/payments/comgate/webhook`
    const minorUnits = toMinorUnits(transaction.money.amount)

    const data = await comgatePostForm(`${API_BASE}/v1.0/create`, {
      merchant: this.config.merchant,
      secret: this.config.secret,
      price: String(minorUnits),
      curr: transaction.money.currency,
      label: transaction.label.slice(0, 16),
      email: transaction.email,
      ...(transaction.payerName ? { fullName: transaction.payerName } : {}),
      ...(transaction.billingAddress
        ? {
            billingAddrCity: String(transaction.billingAddress.city ?? ''),
            billingAddrStreet: String(transaction.billingAddress.street ?? ''),
            billingAddrPostalCode: String(transaction.billingAddress.postalCode ?? ''),
            billingAddrCountry: String(transaction.billingAddress.country ?? ''),
          }
        : {}),
      category: 'OTHER',
      delivery: 'ELECTRONIC_DELIVERY',
      refId: transaction.uuid,
      method: transaction.paymentMethod === 'comgate-card' ? 'CARD_ALL' : 'ALL',
      country: 'ALL',
      expirationTime: '1d',
      prepareOnly: 'true',
      test: this.config.test ? 'true' : 'false',
      returnUrl,
      url_paid: returnUrl,
      url_cancelled: returnUrl,
      url_pending: returnUrl,
      notifyUrl,
    })

    if (data.code !== undefined && data.code !== '0') {
      throw new PaymentGatewayError('Comgate rejected payment creation.')
    }
    if (!data.redirect || !data.transId) {
      throw new PaymentGatewayError('Comgate response is missing redirect/transId.')
    }

    return {
      redirectUrl: data.redirect,
      gatewayTransactionId: data.transId,
      payload: {
        code: data.code,
        ...(data.message === 'OK' ? { message: 'OK' } : {}),
        transId: data.transId,
        redirect: data.redirect,
        redirectUrl: data.redirect,
        gatewayTransactionId: data.transId,
      },
    }
  }

  async handleWebhook(request: Request): Promise<WebhookResult> {
    const form = await request.formData()
    const get = (key: string): string | null => {
      const value = form.get(key)
      return typeof value === 'string' ? value : null
    }

    if (get('merchant') !== this.config.merchant) {
      throw new PaymentGatewayError('Merchant mismatch.')
    }
    if (get('secret') !== this.config.secret) {
      throw new PaymentGatewayError('Secret mismatch.')
    }
    const refId = get('refId')
    if (!refId) {
      throw new PaymentGatewayError('Missing reference ID.')
    }
    const transaction = await this.config.store.findByUuid(refId)
    if (!transaction) {
      throw new PaymentGatewayError('Transaction not found.')
    }

    const acknowledgement = { status: 200, body: 'OK' }

    // Idempotent: a duplicate webhook for an already-resolved transaction
    // still gets a 200 so Comgate stops retrying.
    if (
      transaction.state === 'paid' ||
      (!transaction.checkoutId && isPaymentResult(transaction.state))
    ) {
      return {
        transactionUuid: refId,
        outcome: { state: transaction.state, callbackPayload: transaction.callbackPayload ?? {} },
        acknowledgement,
      }
    }
    if ((!transaction.checkoutId && transaction.state !== 'begun') || !['created', 'begun', 'pending-payment', 'failed', 'cancelled'].includes(transaction.state)) {
      throw new PaymentGatewayError('Transaction cannot be handled at this point.')
    }

    if (transaction.checkoutId)
      this.verifyPayment(
        transaction,
        Object.fromEntries(
          [...form.entries()].filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        ),
      )
    const status = get('status')
    const state = status === 'PAID' ? 'paid' : status === 'CANCELLED' ? 'cancelled' : null
    if (!state) {
      throw new PaymentGatewayError(`Unhandled Comgate status: ${status || '(missing)'}`)
    }

    // Comgate's webhook body echoes back `merchant`/`secret` (that's how we just
    // verified it above) — strip both before persisting so the shared secret never
    // sits in plaintext in a `transactions` row, DB export, or admin view.
    const callbackPayload: Record<string, unknown> = {}
    for (const key of ['transId', 'refId', 'status', 'price', 'curr', 'method']) {
      const value = get(key)
      if (value !== null) callbackPayload[key] = value
    }

    return { transactionUuid: refId, outcome: { state, callbackPayload }, acknowledgement }
  }

  async handleReturn(_transaction: Transaction): Promise<PaymentOutcome | null> {
    return null
  }

  private verifyPayment(transaction: Transaction, data: Record<string, string>): void {
    if (
      data.transId !== transaction.payload.gatewayTransactionId ||
      data.refId !== transaction.uuid ||
      data.curr !== transaction.money.currency ||
      data.price !== String(toMinorUnits(transaction.money.amount))
    ) {
      throw new PaymentGatewayError('Comgate payment identity or amount mismatch.')
    }
  }

  async checkStatus(transaction: Transaction): Promise<PaymentOutcome | null> {
    const transId = transaction.payload.gatewayTransactionId
    if (!transId) throw new PaymentGatewayError('Comgate transaction id is unavailable.')
    const data = await comgatePostForm(`${API_BASE}/v1.0/status`, {
      merchant: this.config.merchant,
      secret: this.config.secret,
      transId,
    })
    if (data.code !== '0') throw new PaymentGatewayError('Comgate status is unavailable.')
    this.verifyPayment(transaction, data)
    const state = data.status === 'PAID' ? 'paid' : data.status === 'CANCELLED' ? 'cancelled' : null
    if (!state) return null
    return {
      state,
      callbackPayload: Object.fromEntries(
        ['transId', 'refId', 'status', 'price', 'curr', 'method']
          .filter((key) => data[key] !== undefined)
          .map((key) => [key, data[key]]),
      ),
    }
  }

  async cancel(transaction: Transaction): Promise<PaymentOutcome | null> {
    const current = await this.checkStatus(transaction)
    if (current) return current
    const transId = transaction.payload.gatewayTransactionId
    if (!transId) throw new PaymentGatewayError('Comgate transaction id is unavailable.')
    const data = await comgatePostForm(`${API_BASE}/v1.0/cancel`, {
      merchant: this.config.merchant,
      secret: this.config.secret,
      transId,
    })
    // A payment may settle during cancellation. Re-read even for the documented 1400 race.
    if (data.code !== '0' && data.code !== '1400')
      throw new PaymentGatewayError('Comgate cancellation could not be confirmed.')
    return this.checkStatus(transaction)
  }
}
