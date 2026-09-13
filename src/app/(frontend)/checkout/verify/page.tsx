import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { checkoutEnabled } from '@/lib/checkout/feature'
import { VerifyCheckoutForm } from '../IdentityForms'
import styles from '../identity.module.css'

export const metadata = {
  title: 'Confirm checkout email — Rockbusters',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
}
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  if (!checkoutEnabled()) notFound()
  const { checkout } = await searchParams
  const id = Number(checkout)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  return (
    <MarketingShell>
      <main className={styles.main}>
        <div className={styles.panel}>
          <h1 className={styles.heading}>Confirm your email</h1>
          <p className={styles.body}>
            Confirm below to reserve the trips in your checkout for staff review. Availability is
            checked again when you confirm.
          </p>
          <VerifyCheckoutForm id={id} />
        </div>
      </main>
    </MarketingShell>
  )
}
