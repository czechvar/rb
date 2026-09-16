import { notFound, redirect } from 'next/navigation'

export default async function LegacyCheckoutOperationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound()
  redirect(`/admin/collections/checkouts/${id}/operations`)
}
