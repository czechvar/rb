/** Server-only feature decision; public components receive only the resulting boolean. */
export function checkoutEnabled(): boolean {
  return process.env.CHECKOUT_ENABLED === 'true'
}
