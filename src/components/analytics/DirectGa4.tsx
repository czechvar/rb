import { DirectGa4Client } from './DirectGa4Client'

export function DirectGa4() {
  if (!process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || process.env.SITE_INDEXABLE === 'true') return null
  return <DirectGa4Client />
}
