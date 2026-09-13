import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { checkoutEnabled } from '@/lib/checkout/feature'
import { CheckoutInvitationForm } from '../IdentityForms'
import styles from '../identity.module.css'

export const metadata = {
  title: 'Your approved checkout — Rockbusters',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
}
export default async function InvitePage({
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
          <h1 className={styles.heading}>Your checkout is approved</h1>
          <p className={styles.body}>
            Set up your account or sign in to your existing account, then continue to payment.
          </p>
          <CheckoutInvitationForm id={id} />
        </div>
      </main>
    </MarketingShell>
  )
}
