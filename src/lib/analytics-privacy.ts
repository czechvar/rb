/** Checkout and account paths never send page URLs or interaction data to analytics. */
export function isPrivateAnalyticsPath(pathname: string): boolean {
  return /^\/(checkout|account|book|login|register|forgot-password|reset-password|verify-email)(\/|$)/.test(
    pathname,
  )
}
