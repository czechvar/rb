import Link from 'next/link'
import styles from './Destinations.module.css'

const DESTINATIONS = [
  { flag: '🇪🇸', name: 'Spain', country: 'spain', crags: 'Rodellar, Siurana, Margalef' },
  { flag: '🇫🇷', name: 'France', country: 'france', crags: 'Verdon, Céüse, Buoux' },
  { flag: '🇮🇹', name: 'Italy', country: 'italy', crags: 'Arco, Finale, Dolomites' },
  { flag: '🇬🇷', name: 'Greece', country: 'greece', crags: 'Leonidio, Kalymnos, Meteora' },
  { flag: '🇸🇮', name: 'Slovenia', country: 'slovenia', crags: 'Osp, Mišja Peč, Istria' },
  { flag: '🇩🇪', name: 'Germany', country: 'germany', crags: 'Frankenjura, Saxon Switzerland' },
  { flag: '🇨🇿', name: 'Czechia', country: 'czechia', crags: 'Labské Pískovce, Moravský Kras' },
  { flag: '🇳🇴', name: 'Norway', country: 'norway', crags: 'Flatanger, Åndalsnes, Romsdal' },
  { flag: '🇦🇹', name: 'Austria', country: 'austria', crags: 'Schleierwasserfall, Innsbruck' },
  { flag: '🌍', name: '& Beyond', country: 'beyond', crags: 'Morocco, Jordan, and more' },
]

export function Destinations() {
  return (
    <section className={styles.section} id="destinations">
      <p className="section-label reveal">Where we climb</p>
      <h2 className="section-title reveal">
        EUROPE&apos;S FINEST CRAGS.
        <br />
        WE KNOW EVERY ONE.
      </h2>
      <div className={styles.grid}>
        {DESTINATIONS.map((d) => (
          <Link
            key={d.country}
            href={`/destinations?country=${d.country}`}
            className={`${styles.card} reveal`}
          >
            <div className={styles.flag}>{d.flag}</div>
            <h3 className={styles.name}>{d.name}</h3>
            <p className={styles.crags}>{d.crags}</p>
          </Link>
        ))}
      </div>
      <div className={styles.ctaWrap}>
        <Link href="/destinations" className="btn-primary">
          Explore Destinations
        </Link>
      </div>
    </section>
  )
}
