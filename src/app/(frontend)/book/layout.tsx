import React from 'react'
import { MarketingShell } from '@/components/marketing/MarketingShell'

// Purely visual — booking pages keep their own auth redirects because they
// carry ?next= context this layout can't know.
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Booking' }]}>
      {children}
    </MarketingShell>
  )
}
