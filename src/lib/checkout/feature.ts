/** Server-only rollout decision; explicitly setting false is the emergency legacy fallback. */
export function checkoutEnabled(): boolean {
  return process.env.CHECKOUT_ENABLED !== 'false'
}

export function checkoutEntryHref(eventDateId: number): string {
  return checkoutEnabled() ? `/cart?add=${eventDateId}` : `/book/${eventDateId}`
}
