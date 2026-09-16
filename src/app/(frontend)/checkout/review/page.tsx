import { redirect } from 'next/navigation'

export default function LegacyCheckoutReviewPage() {
  redirect('/admin/collections/checkouts/operations?filter=waiting-review')
}
