import Link from 'next/link'
import { notFound } from 'next/navigation'
import { checkoutEnabled } from '@/lib/checkout/feature'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import styles from '@/components/checkout/checkout.module.css'
export const metadata = {
  title: 'Check your email — Rockbusters',
  robots: { index: false, follow: false },
}
export default function CheckEmailPage() {
  if (!checkoutEnabled()) notFound()
  return (
    <MarketingShell>
      <main className={styles.page}>
        <div className={styles.inner}>
          <h1>Check your email</h1>
          <p className={styles.lead}>
            Open the verification email and confirm your request. Places are reserved only after
            confirmation and a fresh availability check.
          </p>
          <p className={styles.lead}>
            We will then review your request. Approval comes with the next steps for your account
            and payment.
          </p>
          <div className={styles.actions}>
            <Link href="/cart" className={`${styles.button} ${styles.secondary}`}>
              Back to your cart
            </Link>
            <Link href="/contact">Need help?</Link>
          </div>
        </div>
      </main>
    </MarketingShell>
  )
}
