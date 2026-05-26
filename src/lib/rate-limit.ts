/**
 * Best-effort in-memory rate limiter. Survives one serverless invocation
 * only — not a security boundary, just friction. Use Vercel KV / Redis
 * for production-grade. Tracked as future work in the spec.
 */

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 }
  }
  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count }
}

/** Test-only — clears all buckets. Do not call from app code. */
export function __resetRateLimitForTests(): void {
  buckets.clear()
}
