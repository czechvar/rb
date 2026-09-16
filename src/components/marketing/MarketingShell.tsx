import { checkoutEnabled } from '@/lib/checkout/feature'
import { Header } from './Header'
import { Footer } from './Footer'
import { Breadcrumb, type Crumb } from './Breadcrumb'

export function MarketingShell({
  crumbs = [],
  children,
}: {
  crumbs?: Crumb[]
  children: React.ReactNode
}) {
  return (
    <>
      <Header checkoutEnabled={checkoutEnabled()} />
      <Breadcrumb items={crumbs} />
      {children}
      <Footer />
    </>
  )
}
