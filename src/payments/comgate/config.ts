export interface ComgateEnvConfig {
  merchant: string
  secret: string
  test: boolean
}

/**
 * Reads Comgate credentials from the environment, failing fast (same
 * pattern as `requireEnv` in `src/payload.config.ts`) rather than silently
 * defaulting to empty strings that would only surface as a cryptic Comgate
 * API error later.
 */
export function comgateConfigFromEnv(): ComgateEnvConfig {
  const merchant = process.env.COMGATE_MERCHANT
  const secret = process.env.COMGATE_SECRET
  if (!merchant || !secret) {
    throw new Error(
      'COMGATE_MERCHANT and COMGATE_SECRET must be set to accept card payments.',
    )
  }
  // Defaults to sandbox (true) unless explicitly turned off — a missing/mistyped
  // value should never accidentally enable real charges.
  return { merchant, secret, test: process.env.COMGATE_TEST_MODE !== 'false' }
}
