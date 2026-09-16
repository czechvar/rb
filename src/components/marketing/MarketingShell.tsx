import { checkoutEnabled } from '@/lib/checkout/feature'
import { Header } from './Header'
import { Footer } from './Footer'
import { Breadcrumb, type Crumb } from './Breadcrumb'

export function MarketingShell({
  crumbs = [],
  breadcrumbTone = 'light',
  children,
}: {
  crumbs?: Crumb[]
  breadcrumbTone?: 'light' | 'dark'
  children: React.ReactNode
}) {
  return (
    <>
      <Header checkoutEnabled={checkoutEnabled()} />
      <Breadcrumb items={crumbs} tone={breadcrumbTone} />
      {children}
      <Footer />
    </>
  )
}
