import styles from './checkout.module.css'

/** Accepted card-payment marks shown beside the Comgate method label. */
export function PaymentMethodLogos() {
  return (
    <span
      className={styles.methodLogos}
      role="img"
      aria-label="Visa, Mastercard, Apple Pay, Google Pay"
    >
      <svg viewBox="0 0 48 30" aria-hidden="true">
        <rect width="48" height="30" rx="4" fill="#fff" />
        <text
          x="24"
          y="20.5"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="14"
          fontStyle="italic"
          fontWeight="700"
          fill="#1434cb"
        >
          VISA
        </text>
      </svg>
      <svg viewBox="0 0 48 30" aria-hidden="true">
        <rect width="48" height="30" rx="4" fill="#fff" />
        <circle cx="19" cy="15" r="8.5" fill="#eb001b" />
        <circle cx="29" cy="15" r="8.5" fill="#f79e1b" />
        <path d="M24 8.13a8.5 8.5 0 0 1 0 13.74a8.5 8.5 0 0 1 0-13.74z" fill="#ff5f00" />
      </svg>
      <svg viewBox="0 0 62 30" aria-hidden="true">
        <rect width="62" height="30" rx="4" fill="#fff" />
        <text
          x="31"
          y="19.5"
          textAnchor="middle"
          fontFamily="-apple-system, 'Helvetica Neue', Arial, sans-serif"
          fontSize="11.5"
          fontWeight="600"
          fill="#000"
        >
          Apple Pay
        </text>
      </svg>
      <svg viewBox="0 0 66 30" aria-hidden="true">
        <rect width="66" height="30" rx="4" fill="#fff" />
        <text
          x="33"
          y="19.5"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="11.5"
          fontWeight="600"
          fill="#3c4043"
        >
          Google Pay
        </text>
      </svg>
    </span>
  )
}
