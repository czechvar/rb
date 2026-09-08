/**
 * TypeScript port of snowbusters
 * api/app/PaymentsModule/service/MuzaPayGateway.php — the Benefit+ gateway.
 *
 * Unlike Comgate, MuzaPay sends NO webhook. The payment result is read from
 * its status endpoint, once when the payer returns and again from the cron
 * sweep. See docs/superpowers/specs/2026-09-02-benefit-plus-gateway-design.md.
 */

import {
  PaymentGatewayError,
  type BeginResult,
  type PaymentGateway,
  type PaymentOutcome,
  type Transaction,
  type TransactionStore,
  type WebhookResult,
} from '../gateway'
import { toMinorUnits } from '../money'
import { MuzaPayClient } from './client'
import { MuzaPaySignatureBuilder } from './signature-builder'
import { MuzaPaySigner } from './signer'
import { getMuzaPayTokenProvider, type MuzaPayTokenProvider } from './token-provider'

const ORDER_DESCRIPTION_MAX_LENGTH = 255

/**
 * MuzaPay's payment states. Note `CANCELED` — a single L, unlike our
 * `cancelled`. Anything unrecognised maps to null, i.e. "still pending",
 * which is the safe direction: a payment is never wrongly marked terminal.
 */
function mapPaymentState(paymentState: string): PaymentOutcome['state'] | null {
  switch (paymentState.toUpperCase()) {
    case 'PAID':
      return 'paid'
    case 'CANCELED':
      return 'cancelled'
    case 'DECLINED':
    case 'EXPIRED':
      return 'failed'
    default:
      return null
  }
}

export interface MuzaPayGatewayConfig {
  baseUrl: string
  eshopId: string
  eshopPassword: string
  country: string
  tokenScope: string
  privateKeyPem: string
  privateKeyPassphrase?: string
  signatureDelimiter: string
  productCode: string
  language: string
  /** API version path segment, e.g. "v4". */
  apiVersion: string
  /** Public base URL of this Next.js app, for building the return URL. */
  backendBaseUrl: string
  store: TransactionStore
}

export class MuzaPayGateway implements PaymentGateway {
  private readonly client: MuzaPayClient
  private readonly signer: MuzaPaySigner
  private readonly signatureBuilder: MuzaPaySignatureBuilder
  private readonly tokenProvider: MuzaPayTokenProvider

  constructor(private readonly config: MuzaPayGatewayConfig) {
    this.client = new MuzaPayClient(config.baseUrl)
    this.signer = new MuzaPaySigner(config.privateKeyPem, config.privateKeyPassphrase)
    this.signatureBuilder = new MuzaPaySignatureBuilder(config.signatureDelimiter)
    this.tokenProvider = getMuzaPayTokenProvider({
      baseUrl: config.baseUrl,
      eshopId: config.eshopId,
      eshopPassword: config.eshopPassword,
      country: config.country,
      tokenScope: config.tokenScope,
      apiVersion: config.apiVersion,
    })
  }

  async begin(transaction: Transaction): Promise<BeginResult> {
    if (transaction.state !== 'created') {
      throw new PaymentGatewayError(
        `Cannot begin the transaction at this point (transaction ${transaction.uuid}).`,
      )
    }
    if (!transaction.orderReference) {
      throw new PaymentGatewayError(
        `MuzaPay requires an order reference on the transaction (transaction ${transaction.uuid}).`,
      )
    }

    const token = await this.tokenProvider.getToken()
    const correlationId = transaction.uuid
    const base = this.config.backendBaseUrl.replace(/\/+$/, '')

    // Field order is signature-critical — the signature is built over these
    // values in exactly this order. Do not reorder, and do not let a
    // formatter or a spread reorder them either.
    const initRequest = {
      amount: String(toMinorUnits(transaction.money.amount)),
      productCode: this.config.productCode,
      orderReferenceCode: transaction.orderReference,
      orderDescription: transaction.label.slice(0, ORDER_DESCRIPTION_MAX_LENGTH),
      merchantData: Buffer.from(transaction.uuid, 'utf8').toString('base64'),
      returnUrl: `${base}/api/payments/muzapay/return?refId=${transaction.uuid}`,
      language: this.config.language,
    }

    const signature = this.signer.signToUrlEncoded(
      this.signatureBuilder.build([correlationId, ...Object.values(initRequest)]),
    )

    const response = await this.client.postJson(
      `/${this.config.apiVersion}/payments/init?signature=${signature}`,
      initRequest,
      {
        Authorization: `Bearer ${token.accessToken}`,
        'x-correlation-id': correlationId,
      },
      200,
    )

    const paymentId = response.paymentId
    const gatewayUrl = response.gatewayUrl
    if (typeof paymentId !== 'string' || typeof gatewayUrl !== 'string') {
      throw new PaymentGatewayError(
        `MuzaPay init response is missing paymentId/gatewayUrl (transaction ${transaction.uuid}).`,
      )
    }

    return {
      redirectUrl: gatewayUrl,
      gatewayTransactionId: paymentId,
      payload: {
        ...initRequest,
        gatewayTransactionId: paymentId,
        redirectUrl: gatewayUrl,
        currency: response.currency,
        beneficiaryId: response.beneficiaryId,
        initResponse: response,
      },
    }
  }

  /**
   * Benefit+ sends no server-to-server callback — the PHP original throws
   * here too. No webhook route exists for this gateway.
   */
  async handleWebhook(_request: Request): Promise<WebhookResult> {
    throw new PaymentGatewayError(
      'Benefit+ does not send webhooks — resolve the payment via checkStatus.',
    )
  }

  async handleReturn(transaction: Transaction): Promise<PaymentOutcome | null> {
    return this.checkStatus(transaction)
  }

  private paymentId(transaction: Transaction): string {
    const id = transaction.payload.gatewayTransactionId
    if (typeof id !== 'string' || id === '') {
      throw new PaymentGatewayError(`Transaction ${transaction.uuid} has no MuzaPay payment id.`)
    }
    return id
  }

  private signedPath(paymentId: string, suffix: string): string {
    const signature = this.signer.signToUrlEncoded(this.signatureBuilder.build([paymentId]))
    return `/${this.config.apiVersion}/payments/${encodeURIComponent(paymentId)}/${suffix}?signature=${signature}`
  }

  async checkStatus(transaction: Transaction): Promise<PaymentOutcome | null> {
    if (transaction.state !== 'begun') return null

    const paymentId = this.paymentId(transaction)
    const token = await this.tokenProvider.getToken()
    const response = await this.client.getJson(
      this.signedPath(paymentId, 'state'),
      { Authorization: `Bearer ${token.accessToken}` },
      200,
    )

    const paymentState = response.paymentState
    if (typeof paymentState !== 'string') return null

    const state = mapPaymentState(paymentState)
    if (state === null) return null

    return { state, callbackPayload: response }
  }

  /**
   * Asks MuzaPay to cancel an in-flight payment, then re-reads the state to
   * see what actually happened — the cancel itself is asynchronous (202), so
   * its acceptance proves nothing. Benefit+ documents at most three attempts
   * at progressive intervals; that spacing comes from the cron sweep calling
   * this once per pass, not from a loop in here.
   */
  async cancel(transaction: Transaction): Promise<PaymentOutcome | null> {
    if (transaction.state !== 'begun') {
      throw new PaymentGatewayError(
        `Cannot cancel the transaction at this point (transaction ${transaction.uuid}).`,
      )
    }

    const paymentId = this.paymentId(transaction)
    const token = await this.tokenProvider.getToken()
    const authorization = { Authorization: `Bearer ${token.accessToken}` }

    await this.client.put(this.signedPath(paymentId, 'cancel'), authorization, 202)

    const response = await this.client.getJson(
      this.signedPath(paymentId, 'state'),
      authorization,
      200,
    )
    const paymentState = response.paymentState
    if (typeof paymentState !== 'string') return null

    const state = mapPaymentState(paymentState)
    if (state === null) return null

    return { state, callbackPayload: response }
  }
}
