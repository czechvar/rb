import styles from './blocks.module.css'

const countryCodes: Record<string, string> = {
  austria: 'at',
  balkans: '',
  croatia: 'hr',
  'czech republic': 'cz',
  czechia: 'cz',
  elsewhere: '',
  france: 'fr',
  germany: 'de',
  greece: 'gr',
  italy: 'it',
  malta: 'mt',
  norway: 'no',
  slovakia: 'sk',
  slovenia: 'si',
  spain: 'es',
  sweden: 'se',
  switzerland: 'ch',
  turkey: 'tr',
}

export function CountryFlag({
  country,
  label = country || 'Unknown country',
  size = 'default',
}: {
  country?: string | null
  label?: string
  size?: 'compact' | 'default' | 'tile'
}) {
  const normalizedCountry = country?.trim().toLowerCase() || ''
  const code = /^[a-z]{2}$/.test(normalizedCountry)
    ? normalizedCountry
    : countryCodes[normalizedCountry]
  const flagClass =
    size === 'compact'
      ? styles.destinationFlagCompact
      : size === 'tile'
        ? styles.locationTileFlag
        : styles.destinationFlag
  const fallbackClass =
    size === 'compact'
      ? styles.flagFallbackCompact
      : size === 'tile'
        ? styles.locationTileFlagFallback
        : styles.flagFallback

  if (!code) return <span className={fallbackClass} aria-hidden="true" />

  const width = size === 'compact' ? 40 : size === 'tile' ? 160 : 80
  return (
    <span
      aria-label={`${label} flag`}
      role="img"
      className={flagClass}
      style={{ backgroundImage: `url(https://flagcdn.com/w${width}/${code}.png)` }}
    />
  )
}
