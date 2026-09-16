import { redirect } from 'next/navigation'

export default function LegacyCheckoutOperationsPage() {
  redirect('/admin/collections/checkouts/operations')
}
