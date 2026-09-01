/**
 * TypeScript port of snowbusters
 * api/app/PaymentsModule/service/ComgateGateway.php.
 *
 * Scope for this port (see docs/superpowers/plans/2026-08-28-comgate-payment-gateway.md):
 * only begin() and handleWebhook() are implemented. checkStatus() and
 * cancel() throw — they back a cron-reconciliation job and a refund flow
 * that this rebuild doesn't have yet. handleReturn() is a no-op in the PHP
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

const API_BASE = 'https://payments.comgate.cz'

/**
 * Converts a decimal-string amount (e.g. "199.00") to integer minor units
 * (e.g. 19900) without ever routing the value through float multiplication.
 * `transaction.money.amount` is a `DecimalString` specifically because
 * floating point is unsafe for money (see `src/payments/gateway.ts`) — do
 * not replace this with `Math.round(Number(amount) * 100)`.
 */
function toMinorUnits(decimal: string): number {
  const [whole, fraction = ''] = decimal.split('.')
  const cents = (fraction + '00').slice(0, 2)
  return Number(whole) * 100 + Number(cents)
}

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
      label: transaction.label,
      email: transaction.email,
      refId: transaction.uuid,
      method: 'ALL',
      prepareOnly: 'true',
      test: this.config.test ? 'true' : 'false',
      returnUrl,
      notifyUrl,
    })

    if (data.code !== undefined && data.code !== '0') {
      throw new PaymentGatewayError(`Comgate API error: ${data.message ?? 'Unknown error'}`)
    }
    if (!data.redirect || !data.transId) {
      throw new PaymentGatewayError('Comgate response is missing redirect/transId.')
    }

    return {
      redirectUrl: data.redirect,
      gatewayTransactionId: data.transId,
      payload: { ...data, redirectUrl: data.redirect, gatewayTransactionId: data.transId },
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
    if (isPaymentResult(transaction.state)) {
      return {
        transactionUuid: refId,
        outcome: { state: transaction.state, callbackPayload: transaction.callbackPayload ?? {} },
        acknowledgement,
      }
    }
    if (transaction.state !== 'begun') {
      throw new PaymentGatewayError('Transaction cannot be handled at this point.')
    }

    const status = get('status')
    const state = status === 'PAID' ? 'paid' : status === 'CANCELLED' ? 'cancelled' : null
    if (!state) {
      throw new PaymentGatewayError(`Unhandled Comgate status: ${status || '(missing)'}`)
    }

    // Comgate's webhook body echoes back `merchant`/`secret` (that's how we just
    // verified it above) — strip both before persisting so the shared secret never
    // sits in plaintext in a `transactions` row, DB export, or admin view.
    const callbackPayload: Record<string, unknown> = {}
    for (const [key, value] of form.entries()) {
      if (key === 'merchant' || key === 'secret') continue
      callbackPayload[key] = value
    }

    return { transactionUuid: refId, outcome: { state, callbackPayload }, acknowledgement }
  }

  async handleReturn(_transaction: Transaction): Promise<PaymentOutcome | null> {
    return null
  }

  async checkStatus(_transaction: Transaction): Promise<PaymentOutcome | null> {
    throw new PaymentGatewayError(
      'ComgateGateway.checkStatus is not implemented (deferred — see docs/superpowers/plans/2026-08-28-comgate-payment-gateway.md).',
    )
  }

  async cancel(_transaction: Transaction): Promise<void> {
    throw new PaymentGatewayError(
      'ComgateGateway.cancel is not implemented (deferred — see docs/superpowers/plans/2026-08-28-comgate-payment-gateway.md).',
    )
  }
}
