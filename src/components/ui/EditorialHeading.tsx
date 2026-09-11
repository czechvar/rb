import { Fragment, type ReactNode } from 'react'
import styles from './EditorialHeading.module.css'

export interface HeadingPart {
  text: string
  accent?: boolean | null
  breakBefore?: boolean | null
}

/** Text segments preserve author-supplied spacing, including accents within a word. */
export function HeadingText({
  parts,
  fallback,
}: {
  parts?: HeadingPart[] | null
  fallback?: ReactNode
}) {
  if (!parts?.length) return <>{fallback}</>

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.breakBefore && index > 0 && <br />}
          {part.accent ? <span className={styles.accent}>{part.text}</span> : part.text}
        </Fragment>
      ))}
    </>
  )
}

export function EditorialHeading({
  as: Tag = 'h2',
  parts,
  children,
  className,
}: {
  as?: 'h1' | 'h2' | 'h3'
  parts?: HeadingPart[] | null
  children?: ReactNode
  className?: string
}) {
  return (
    <Tag className={className}>
      <HeadingText parts={parts} fallback={children} />
    </Tag>
  )
}
