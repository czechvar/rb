import Link from 'next/link'

type BlockActionProps = {
  href?: string | null
  label?: string | null
  className?: string
}

export function BlockAction({ href, label, className }: BlockActionProps) {
  if (!href || !label) return null
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    )
  }
  return (
    <a href={href} className={className} rel="noreferrer" target="_blank">
      {label}
    </a>
  )
}
