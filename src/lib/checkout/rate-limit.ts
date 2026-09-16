interface CheckoutRateLimitEnvironment {
  NODE_ENV?: string
  CHECKOUT_RATE_LIMIT_EMAIL_MAX?: string
  CHECKOUT_RATE_LIMIT_NETWORK_MAX?: string
  CHECKOUT_RATE_LIMIT_GLOBAL_MAX?: string
  CHECKOUT_RATE_LIMIT_WINDOW_SECONDS?: string
}

export interface CheckoutRateLimitConfig {
  emailMax: number
  networkMax: number
  globalMax: number
  windowSeconds: number
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function resolveCheckoutRateLimitConfig(
  environment: CheckoutRateLimitEnvironment,
): CheckoutRateLimitConfig {
  const production = environment.NODE_ENV === 'production'
  return {
    emailMax: positiveInteger(environment.CHECKOUT_RATE_LIMIT_EMAIL_MAX, production ? 3 : 100),
    networkMax: positiveInteger(
      environment.CHECKOUT_RATE_LIMIT_NETWORK_MAX,
      production ? 10 : 100,
    ),
    globalMax: positiveInteger(
      environment.CHECKOUT_RATE_LIMIT_GLOBAL_MAX,
      production ? 100 : 1000,
    ),
    windowSeconds: positiveInteger(
      environment.CHECKOUT_RATE_LIMIT_WINDOW_SECONDS,
      production ? 600 : 60,
    ),
  }
}

export function checkoutRateLimitConfig(): CheckoutRateLimitConfig {
  return resolveCheckoutRateLimitConfig(process.env)
}

export function checkoutRateLimitWindowLabel(): string {
  const seconds = checkoutRateLimitConfig().windowSeconds
  if (seconds < 60) return `${seconds} seconds`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}
