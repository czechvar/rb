// src/components/sections/TagChipStrip.tsx
import styles from './TagChipStrip.module.css'

export type ChipIcon = 'pin' | 'tag' | 'mountain' | 'calendar' | 'gift'

export type TagChip = {
  icon: ChipIcon
  label: string
}

function Icon({ name }: { name: ChipIcon }) {
  switch (name) {
    case 'pin':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
        </svg>
      )
    case 'tag':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path fill="currentColor" d="M21.41 11.58l-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.41l9 9a2 2 0 0 0 2.83 0l7-7a2 2 0 0 0 0-2.83ZM6.5 7A1.5 1.5 0 1 1 8 5.5 1.5 1.5 0 0 1 6.5 7Z" />
        </svg>
      )
    case 'mountain':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path fill="currentColor" d="M14 6 9 14l-3-4-6 10h24L14 6Zm0 4.6 5.4 7.4H8.6L14 10.6Z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14v10ZM5 8V6h14v2H5Z" />
        </svg>
      )
    case 'gift':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path fill="currentColor" d="M20 7h-2.3a3 3 0 0 0-5.7-2 3 3 0 0 0-5.7 2H4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h7v9h2v-9h7a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Zm-5-2a1 1 0 1 1 0 2h-2V6a1 1 0 0 1 1-1Zm-6 0a1 1 0 0 1 1 1v1H8a1 1 0 0 1 0-2Z" />
        </svg>
      )
    default:
      return null
  }
}

export function TagChipStrip({ chips }: { chips: TagChip[] }) {
  return (
    <ul className={styles.strip} aria-label="Trip tags">
      {chips.map((c, i) => (
        <li key={i} className={styles.chip}>
          <Icon name={c.icon} />
          <span className={styles.label}>{c.label}</span>
        </li>
      ))}
    </ul>
  )
}
