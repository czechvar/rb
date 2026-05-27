/**
 * Payment gateway abstraction — DRAFT
 *
 * TypeScript port of the snowbusters PHP gateway layer
 * (snowbusters: api/app/PaymentsModule/service/, api/app/model/Transaction/).
 *
 * This file defines the domain types and the `PaymentGateway` contract only.
 * Concrete gateways (ComGate, MuzaPay, PayPal, bank transfer), the Payload
 * persistence layer, and webhook/return route handlers are implemented
 * separately against these types.
 *
 * Design notes vs. the PHP original:
 * - PHP gateways mutate the `Transaction` entity in place. Here gateway
 *   methods are pure-ish: they return result objects and the caller
 *   (a PaymentService) persists them. This keeps gateways decoupled from
 *   Payload.
 * - PHP `Transaction` is a Doctrine entity with behaviour (begin/finish state
 *   guards). Here `Transaction` is a plain record; state transitions live in
 *   the PaymentService, validated with `isPaymentResult` / `canTransitionTo`.
 */

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

/**
 * A decimal amount as a string, e.g. "1499.0000". Never a JS number —
 * floating point is unsafe for money. Mirrors PHP's bcmath decimal strings.
 */
export type DecimalString = string;

export interface Money {
  /** Total amount, VAT inclusive. */
  amount: DecimalString;
  /** Amount excluding VAT. */
  amountWithoutVat: DecimalString;
  /** ISO 4217 currency code, e.g. "CZK", "EUR". */
  currency: string;
}

// ---------------------------------------------------------------------------
// Transaction state — mirrors PHP TransactionState enum
// ---------------------------------------------------------------------------

export type TransactionState =
  | 'created' // record created, gateway not yet contacted
  | 'begun' // gateway contacted, payer redirected to pay
  | 'pending-payment' // gateway acknowledged, awaiting final result
  | 'paid' // terminal: payment succeeded
  | 'cancelled' // terminal: payment cancelled
  | 'failed'; // payment attempt failed (retryable)

/** Terminal states representing a definitive payment result. */
const PAYMENT_RESULT_STATES: ReadonlySet<TransactionState> = new Set(['paid', 'cancelled']);

/**
 * Whether a state is a definitive payment result. Used for webhook
 * idempotence — a transaction already in a result state ignores further
 * callbacks (cf. PHP `Transaction::finish`).
 */
export function isPaymentResult(state: TransactionState): boolean {
  return PAYMENT_RESULT_STATES.has(state);
}

/** Whether a failed/cancelled transaction may be retried with a new attempt. */
export function isRetryable(state: TransactionState): boolean {
  return state === 'cancelled' || state === 'failed';
}

// ---------------------------------------------------------------------------
// Payment methods — mirrors snowbusters OrderPaymentMethod constants
// ---------------------------------------------------------------------------

export type PaymentMethod =
  | 'paypal'
  | 'muzapay'
  | 'comgate-card'
  | 'comgate-transfer'
  | 'bank-transfer'; // PHP: AutopayGateway / default

// ---------------------------------------------------------------------------
// Transaction record
// ---------------------------------------------------------------------------

/** Gateway data captured during begin() and persisted on the transaction. */
export interface GatewayPayload {
  /** URL to redirect the payer to in order to complete payment. */
  redirectUrl?: string;
  /** Gateway-side transaction identifier (PHP payload `transId`). */
  gatewayTransactionId?: string;
  /** Additional gateway-specific data. */
  [key: string]: unknown;
}

/**
 * A payment transaction. Backed by a Payload `transactions` collection
 * document. Plain data — no behaviour (see design notes above).
 */
export interface Transaction {
  /** Payload document id. */
  id: string;
  /** Stable public identifier (UUID v4), safe to expose in URLs. */
  uuid: string;
  money: Money;
  /** Short human label shown to the payer / on the gateway. */
  label: string;
  /** Payer email. */
  email: string;
  state: TransactionState;
  paymentMethod: PaymentMethod;
  /** Gateway data from begin(); empty until the transaction has begun. */
  payload: GatewayPayload;
  /** Raw data from the gateway callback/webhook; null until resolved. */
  callbackPayload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Gateway operation results
// ---------------------------------------------------------------------------

/** Result of begin() — everything needed to send the payer to the gateway. */
export interface BeginResult {
  /** URL to redirect the payer to. */
  redirectUrl: string;
  /** Gateway-side transaction identifier. */
  gatewayTransactionId: string;
  /** Full payload to persist on `Transaction.payload`. */
  payload: GatewayPayload;
}

/** A resolved payment outcome from a webhook, return, or status check. */
export interface PaymentOutcome {
  state: TransactionState;
  /** Raw gateway data to persist on `Transaction.callbackPayload`. */
  callbackPayload: Record<string, unknown>;
}

/**
 * The HTTP response a gateway expects us to return from its webhook
 * endpoint (e.g. ComGate expects a specific ack body). Returned by
 * handleWebhook so the route handler can reply correctly.
 */
export interface WebhookAcknowledgement {
  status: number;
  body: string;
  contentType?: string;
}

/** Result of processing an inbound gateway webhook. */
export interface WebhookResult {
  /** UUID of the transaction the webhook refers to. */
  transactionUuid: string;
  outcome: PaymentOutcome;
  /** HTTP response the gateway expects from its webhook endpoint. */
  acknowledgement: WebhookAcknowledgement;
}

// ---------------------------------------------------------------------------
// Persistence port
// ---------------------------------------------------------------------------

/**
 * Minimal transaction lookup a gateway needs while processing a webhook
 * (a webhook arrives knowing only gateway-side identifiers). Implemented by
 * the Payload-backed PaymentService; gateways receive it via constructor.
 */
export interface TransactionStore {
  findByUuid(uuid: string): Promise<Transaction | null>;
  findByGatewayTransactionId(gatewayTransactionId: string): Promise<Transaction | null>;
}

// ---------------------------------------------------------------------------
// Gateway contract — mirrors PHP `PaymentGateway` interface
// ---------------------------------------------------------------------------

export interface PaymentGateway {
  /**
   * Initiate a payment with the provider. Caller must persist the returned
   * payload and move the transaction to `begun`.
   * PHP: `begin(Transaction): void`.
   */
  begin(transaction: Transaction): Promise<BeginResult>;

  /**
   * Process an inbound server-to-server webhook. Must be idempotent — the
   * same callback may arrive more than once.
   * PHP: `handle(IRequest): Transaction`.
   */
  handleWebhook(request: Request): Promise<WebhookResult>;

  /**
   * Resolve the outcome when the payer returns to our site from the gateway.
   * May re-query the provider. Returns null if still pending.
   * PHP: `return(Transaction): void`.
   */
  handleReturn(transaction: Transaction): Promise<PaymentOutcome | null>;

  /**
   * Poll the provider for the current status. Used by scheduled jobs and
   * on-demand checks. Returns null if still pending.
   * PHP: `checkStatus(Transaction): ?TransactionState`.
   */
  checkStatus(transaction: Transaction): Promise<PaymentOutcome | null>;

  /**
   * Cancel/reverse a previously initiated payment. May be asynchronous —
   * verify the result with checkStatus().
   * PHP: `cancel(Transaction): void`.
   */
  cancel(transaction: Transaction): Promise<void>;
}

/** Raised by gateways for provider/transport failures. PHP: `PaymentGatewayException`. */
export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Per-gateway configuration, sourced from environment variables.
 * Mirrors the constructor args of PHP `PaymentGatewayFactory`.
 */
export interface PaymentGatewayConfig {
  /** Public base URL of this backend, for building webhook/return URLs. */
  backendBaseUrl: string;
  /** Public base URL of the storefront, for post-payment redirects. */
  frontendBaseUrl: string;

  comgate: {
    merchant: string;
    secret: string;
    test: boolean;
  };

  muzapay: {
    baseUrl: string;
    eshopId: string;
    eshopPassword: string;
    country: string;
    tokenScope: string;
    /** PEM private key used for request signing (value, not a path). */
    privateKey: string;
    privateKeyPassphrase?: string;
    signatureDelimiter: string;
    defaultProductCode: string;
    defaultLanguage: string;
  };

  paypal: {
    clientId: string;
    clientSecret: string;
    /** "sandbox" | "live" */
    environment: 'sandbox' | 'live';
  };
}

/** Resolves a concrete gateway for a given payment method. */
export type PaymentGatewayFactory = (method: PaymentMethod) => PaymentGateway;

// ---------------------------------------------------------------------------
// DRAFT — open questions to settle before implementing concrete gateways
// ---------------------------------------------------------------------------
//
// 1. Webhook routing: one shared endpoint that dispatches by method, or one
//    route per gateway? PHP uses PaymentPresenter actions per gateway.
// 2. handleWebhook receives the Web `Request`; confirm Payload custom
//    endpoints expose it (vs. a Next.js route handler forwarding to a
//    service). Stable public URLs are required either way.
// 3. checkStatus scheduling: Payload Jobs Queue vs. external cron hitting an
//    endpoint. PHP runs it as a cron.
// 4. MuzaPay signing (MuzaPaySigner / SignatureBuilder / TokenProvider) must
//    be ported byte-exact and verified against the MuzaPay sandbox before
//    anything else — see snowbusters api/MUZAPAY_README.md.
