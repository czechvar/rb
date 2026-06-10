import { Header } from './Header'
import { Footer } from './Footer'
import { Breadcrumb, type Crumb } from './Breadcrumb'

export function MarketingShell({
  crumbs = [],
  children,
  transparentHeader = false,
}: {
  crumbs?: Crumb[]
  children: React.ReactNode
  transparentHeader?: boolean
}) {
  return (
    <>
      <Header transparent={transparentHeader} />
      {!transparentHeader && <Breadcrumb items={crumbs} />}
      {children}
      <Footer />
    </>
  )
}
