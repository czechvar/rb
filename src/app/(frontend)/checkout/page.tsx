import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { CheckoutFlow } from '@/components/checkout/CheckoutFlow'
import { checkoutEnabled } from '@/lib/checkout/feature'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { isReturningPurchaser } from '@/lib/checkout/reservations'
import styles from '@/components/checkout/checkout.module.css'

export const metadata = { title: 'Checkout — Rockbusters', robots: { index: false, follow: false } }
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>
}) {
  if (!checkoutEnabled()) notFound()
  const { add } = await searchParams
  const id = add && /^\d+$/.test(add) && Number.isSafeInteger(Number(add)) ? Number(add) : undefined
  const user = await getCurrentUser()
  const returning = user ? await isReturningPurchaser(await getPayloadClient(), user) : false
  const address = user?.addresses?.find((entry) => entry.isDefault) || user?.addresses?.[0]
  return (
    <MarketingShell>
      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.header}>
            <p className={styles.eyebrow} data-eyebrow="section">
              Checkout
            </p>
            <h1>Review your trips</h1>
            <p className={styles.lead}>
              Check your dates and details. Your basket is reserved together, with one order for
              each dated trip.
            </p>
          </header>
          <CheckoutFlow
            mode="checkout"
            add={id}
            returning={returning}
            initialBilling={
              address
                ? {
                    firstName: address.firstName,
                    lastName: address.lastName,
                    street: address.street,
                    city: address.city,
                    postalCode: address.postalCode,
                    country: address.country,
                  }
                : undefined
            }
            contact={
              user
                ? { name: user.name || '', email: user.email, phone: user.phone || '' }
                : undefined
            }
          />
        </div>
      </main>
    </MarketingShell>
  )
}
