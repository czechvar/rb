/**
 * Reads MuzaPay (Benefit+) credentials from the environment. Fails fast on
 * missing values, matching `comgateConfigFromEnv()` — a cryptic signature
 * rejection from the gateway is a much worse first symptom than a clear
 * startup error.
 *
 * The private key is expected base64-encoded, because a multi-line PEM
 * survives neither `.env` files nor `vercel env pull` cleanly. A raw PEM is
 * accepted too, so a local developer pasting the file contents still works.
 */

export interface MuzaPayEnvConfig {
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
}

const REQUIRED = [
  'MUZAPAY_BASE_URL',
  'MUZAPAY_ESHOP_ID',
  'MUZAPAY_ESHOP_PASSWORD',
  'MUZAPAY_PRIVATE_KEY',
] as const

function decodePrivateKey(raw: string): string {
  if (raw.includes('-----BEGIN')) return raw
  return Buffer.from(raw, 'base64').toString('utf8')
}

export function muzapayConfigFromEnv(): MuzaPayEnvConfig {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `${missing.join(', ')} must be set to accept Benefit+ payments.`,
    )
  }

  return {
    baseUrl: process.env.MUZAPAY_BASE_URL as string,
    eshopId: process.env.MUZAPAY_ESHOP_ID as string,
    eshopPassword: process.env.MUZAPAY_ESHOP_PASSWORD as string,
    country: process.env.MUZAPAY_COUNTRY || 'CZ',
    tokenScope: process.env.MUZAPAY_TOKEN_SCOPE || 'SINGLE_PAYMENT',
    privateKeyPem: decodePrivateKey(process.env.MUZAPAY_PRIVATE_KEY as string),
    privateKeyPassphrase: process.env.MUZAPAY_PRIVATE_KEY_PASSPHRASE || undefined,
    signatureDelimiter: '|',
    productCode: process.env.MUZAPAY_PRODUCT_CODE || 'LEISURE',
    language: process.env.MUZAPAY_LANGUAGE || 'cs',
  }
}

/**
 * Whether Benefit+ can be offered at all. Never throws — the confirmation
 * page calls this to decide whether to render the button, the same
 * defensive fallback pattern as the R2 and Resend configuration.
 */
export function isBenefitPlusConfigured(): boolean {
  return REQUIRED.every((key) => Boolean(process.env[key]))
}
