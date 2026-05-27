import { MarketingShell } from '@/components/marketing/MarketingShell'

export default function NotFound() {
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Not found' }]}>
      <main style={{ padding: '60px', textAlign: 'center' }}>
        <h1>Program not found</h1>
        <p>This program may not exist yet or is currently unpublished.</p>
      </main>
    </MarketingShell>
  )
}
