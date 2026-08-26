import Link from 'next/link'
import { normalizeActionHref } from '@/lib/safe-url'

type BlockActionProps = {
  href?: string | null
  label?: string | null
  className?: string
}

export function BlockAction({ href, label, className }: BlockActionProps) {
  if (!href || !label) return null
  const safeHref = normalizeActionHref(href)
  if (!safeHref) return null
  if (safeHref.startsWith('/')) {
    return (
      <Link href={safeHref} className={className}>
        {label}
      </Link>
    )
  }
  return (
    <a href={safeHref} className={className} rel="noreferrer" target="_blank">
      {label}
    </a>
  )
}
