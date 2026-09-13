import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { CheckoutFlow } from '@/components/checkout/CheckoutFlow'
import { checkoutEnabled } from '@/lib/checkout/feature'
import styles from '@/components/checkout/checkout.module.css'

export const metadata = {
  title: 'Your cart — Rockbusters',
  robots: { index: false, follow: false },
}
export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>
}) {
  if (!checkoutEnabled()) notFound()
  const { add } = await searchParams
  const id = add && /^\d+$/.test(add) && Number.isSafeInteger(Number(add)) ? Number(add) : undefined
  return (
    <MarketingShell>
      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.header}>
            <p className={styles.eyebrow} data-eyebrow="section">
              Your next adventure
            </p>
            <h1>Your climbing cart</h1>
            <p className={styles.lead}>
              Choose your trips and the number of places you need. Reserve them together when you
              are ready.
            </p>
          </header>
          <CheckoutFlow mode="cart" add={id} />
        </div>
      </main>
    </MarketingShell>
  )
}
