/**
 * Converts a decimal-string amount (e.g. "199.00") to integer minor units
 * (e.g. 19900) without ever routing the value through float multiplication.
 * `Money.amount` is a `DecimalString` specifically because floating point is
 * unsafe for money (see `src/payments/gateway.ts`) — do not replace this with
 * `Math.round(Number(amount) * 100)`.
 *
 * Fractions beyond two places are truncated, not rounded: amounts reaching a
 * gateway are already rounded to 2dp at persistence time.
 */
export function toMinorUnits(decimal: string): number {
  const [whole, fraction = ''] = decimal.split('.')
  const cents = (fraction + '00').slice(0, 2)
  return Number(whole) * 100 + Number(cents)
}
