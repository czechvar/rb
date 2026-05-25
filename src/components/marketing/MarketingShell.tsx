import { Header } from './Header'
import { Footer } from './Footer'
import { Breadcrumb, type Crumb } from './Breadcrumb'

export function MarketingShell({ crumbs, children }: { crumbs: Crumb[]; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <Breadcrumb items={crumbs} />
      {children}
      <Footer />
    </>
  )
}
