/**
 * Dev seed for Rockbusters. Idempotent: skips records whose unique key
 * (slug / iata / name+dateFrom) is already present. Safe to re-run.
 *
 *   pnpm seed
 *
 * Reads DATABASE_URL from `.env`, so it targets whatever DB your dev
 * server uses. Do NOT run against production.
 *
 * Content is inspired by the live rockbusters.net catalogue but is
 * placeholder data — refresh from real copy when ready.
 */
import 'dotenv/config'
import { getPayload, type Payload, type CollectionSlug, type Where } from 'payload'
import sharp from 'sharp'
import config from '../src/payload.config'
import {
  BLOCK_DEMO_MEDIA_FILENAME,
  BLOCK_DEMO_PAGE_SLUG,
  BLOCK_DEMO_MARKER,
} from '../src/lib/block-demo'

type Ref = { id: number }

const demoMediaSvg = `
<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="900" fill="#0d0d0d"/>
  <path d="M0 0h1600v900H0z" fill="#111"/>
  <circle cx="1280" cy="190" r="220" fill="#e30713" opacity=".18"/>
  <circle cx="280" cy="760" r="260" fill="#e30713" opacity=".12"/>
  <path d="M160 660 420 330l180 220 130-170 210 280H160Z" fill="#f0ede6" opacity=".9"/>
  <path d="M610 660 780 430l110 150 80-105 140 185H610Z" fill="#f0ede6" opacity=".55"/>
  <text x="160" y="170" fill="#e30713" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="8">CMS PAGE BUILDER</text>
  <text x="160" y="250" fill="#f0ede6" font-family="Arial Black, Impact, sans-serif" font-size="86" font-weight="900">ROCKBUSTERS</text>
  <text x="160" y="320" fill="#f0ede6" font-family="Arial, sans-serif" font-size="34" opacity=".76">Reusable React blocks with safe Payload data bindings</text>
</svg>`

async function demoPng() {
  return sharp(Buffer.from(demoMediaSvg)).png().toBuffer()
}

async function ensure(
  payload: Payload,
  args: {
    collection: CollectionSlug
    where: Where
    data: Record<string, unknown>
    label: string
  },
): Promise<Ref> {
  const { collection, where, data, label } = args
  const existing = await payload.find({ collection, where, limit: 1, depth: 0 })
  if (existing.docs[0]) {
    console.log(`  · skip   ${collection.padEnd(13)} ${label}`)
    return existing.docs[0] as Ref
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const created = await payload.create({ collection, data: data as any })
  console.log(`  ✓ create ${collection.padEnd(13)} ${label}`)
  return created as Ref
}

async function upsert(
  payload: Payload,
  args: {
    collection: CollectionSlug
    where: Where
    data: Record<string, unknown>
    label: string
  },
): Promise<Ref> {
  const { collection, where, data, label } = args
  const existing = await payload.find({ collection, where, limit: 1, depth: 0 })
  if (existing.docs[0]) {
    const updated = await payload.update({
      collection,
      id: existing.docs[0].id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    })
    console.log(`  ✎ update ${collection.padEnd(13)} ${label}`)
    return updated as Ref
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const created = await payload.create({ collection, data: data as any })
  console.log(`  ✓ create ${collection.padEnd(13)} ${label}`)
  return created as Ref
}

async function ensureMedia(
  payload: Payload,
  args: {
    filename: string
    alt: string
    label: string
  },
): Promise<Ref> {
  const png = await demoPng()
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: args.filename } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: 'media',
      id: existing.docs[0].id,
      data: { alt: args.alt },
      file: {
        data: png,
        mimetype: 'image/png',
        name: args.filename,
        size: png.length,
      },
    })
    console.log(`  ✎ update ${'media'.padEnd(13)} ${args.label}`)
    return updated as Ref
  }

  const created = await payload.create({
    collection: 'media',
    data: { alt: args.alt },
    file: {
      data: png,
      mimetype: 'image/png',
      name: args.filename,
      size: png.length,
    },
  })
  console.log(`  ✓ create ${'media'.padEnd(13)} ${args.label}`)
  return created as Ref
}

/**
 * Removes records the previous seed produced that this seed no longer wants.
 * Only deletes by exact slug/iata so user-created admin data is untouched.
 */
async function cleanupPrior(payload: Payload) {
  const eventsToDrop = [
    'arco-climbing-camp',
    'kalymnos-performance-week',
    'technique-foundations',
  ]
  const guidesToDrop = ['tomas-coach', 'marek-coach']
  const locationsToDrop = [
    'arco-italy',
    'kalymnos-greece',
    'frankenjura-germany',
    'mallorca-spain',
    'labske-udoli-czechia',
    'dolomites-italy',
    'cavallers-spain',
  ]
  const airportsToDrop = ['KGS']

  // event-dates first: they FK into events.
  const oldEvents = await payload.find({
    collection: 'events',
    where: { slug: { in: eventsToDrop } },
    limit: 100,
    depth: 0,
  })
  if (oldEvents.docs.length) {
    const ids = oldEvents.docs.map((d) => d.id)
    const datesDel = await payload.delete({
      collection: 'event-dates',
      where: { event: { in: ids } },
    })
    if (datesDel.docs.length) console.log(`  ✗ delete event-dates  ${datesDel.docs.length}`)
    const evDel = await payload.delete({
      collection: 'events',
      where: { id: { in: ids } },
    })
    if (evDel.docs.length) console.log(`  ✗ delete events       ${evDel.docs.length}`)
  }

  for (const [collection, slugs] of [
    ['guides', guidesToDrop],
    ['locations', locationsToDrop],
  ] as const) {
    const del = await payload.delete({ collection, where: { slug: { in: slugs } } })
    if (del.docs.length) console.log(`  ✗ delete ${collection.padEnd(13)} ${del.docs.length}`)
  }

  const apDel = await payload.delete({
    collection: 'airports',
    where: { iata: { in: airportsToDrop } },
  })
  if (apDel.docs.length) console.log(`  ✗ delete airports     ${apDel.docs.length}`)
}

/** Minimal SerializedEditorState wrapping plain paragraphs. */
function richText(...paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            text,
            version: 1,
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
        ],
      })),
    },
  }
}

async function main() {
  const payload = await getPayload({ config })

  console.log('— cleanup prior seed —')
  await cleanupPrior(payload)

  console.log('— taxonomies —')

  const dBeg = await ensure(payload, {
    collection: 'difficulties',
    where: { name: { equals: 'Beginner' } },
    data: { name: 'Beginner', active: true },
    label: 'Beginner',
  })
  const dInt = await ensure(payload, {
    collection: 'difficulties',
    where: { name: { equals: 'Intermediate' } },
    data: { name: 'Intermediate', active: true },
    label: 'Intermediate',
  })
  const dAdv = await ensure(payload, {
    collection: 'difficulties',
    where: { name: { equals: 'Advanced' } },
    data: { name: 'Advanced', active: true },
    label: 'Advanced',
  })

  const catCamps = await ensure(payload, {
    collection: 'categories',
    where: { slug: { equals: 'climbing-camps' } },
    data: {
      name: 'Climbing Camps',
      slug: 'climbing-camps',
      text: 'Multi-day, single-destination programs built around a clear performance goal.',
      position: 1,
      active: true,
    },
    label: 'climbing-camps',
  })
  await ensure(payload, {
    collection: 'categories',
    where: { slug: { equals: 'technique-coaching' } },
    data: {
      name: 'Technique Coaching',
      slug: 'technique-coaching',
      text: 'Small-group movement labs for climbers stuck at a grade plateau.',
      position: 2,
      active: true,
    },
    label: 'technique-coaching',
  })
  await ensure(payload, {
    collection: 'categories',
    where: { slug: { equals: 'private-guiding' } },
    data: {
      name: 'Private Guiding',
      slug: 'private-guiding',
      text: 'Pick your dates, destination, and goal — we handle the logistics.',
      position: 3,
      active: true,
    },
    label: 'private-guiding',
  })

  const programCamps = await upsert(payload, {
    collection: 'programs',
    where: { slug: { equals: 'climbing-camps' } },
    data: {
      name: 'Climbing Camps',
      slug: 'climbing-camps',
      shortDescription:
        'Maximum time on rock, pushing the limits, 100% fun — run by IFMGA / UIAGM guides and IFSC-level coaches.',
      active: true,
      featured: true,
      state: 'published',
      highlights: [
        { text: 'Up to 4 climbers per coach' },
        { text: 'Daily video movement analysis' },
        { text: 'Clear performance goal per camp' },
        { text: 'On-rock days + evening reviews' },
      ],
      audienceCards: [
        {
          heading: 'Plateau-busters',
          body: 'Climbers stuck at a grade who need targeted feedback to break through.',
          highlighted: false,
        },
        {
          heading: 'Send-mode',
          body: 'Climbers with a specific project who want a focused week to send it.',
          highlighted: true,
        },
        {
          heading: 'First-time outdoor',
          body: 'Indoor climbers ready to make the transition to outdoor sport climbing.',
          highlighted: false,
        },
      ],
      results: [
        { text: 'Send your first 6c / 7a outside' },
        { text: 'Lead-climbing confidence and safety' },
        { text: 'A take-home training plan' },
      ],
    },
    label: 'climbing-camps',
  })
  await upsert(payload, {
    collection: 'programs',
    where: { slug: { equals: 'technique-coaching' } },
    data: {
      name: 'Technique Coaching',
      slug: 'technique-coaching',
      shortDescription:
        'Long-weekend or week-long movement labs for climbers stuck at a plateau.',
      active: true,
      state: 'published',
      highlights: [
        { text: '1-on-1 video review' },
        { text: 'Tactical movement analysis' },
        { text: 'Take-home training plan' },
      ],
    },
    label: 'technique-coaching',
  })

  console.log('— locations —')

  const locFrankenjura = await ensure(payload, {
    collection: 'locations',
    where: { slug: { equals: 'frankenjura' } },
    data: {
      name: 'Frankenjura, Germany',
      slug: 'frankenjura',
      content: richText(
        'The Frankenjura in Bavaria is one of the densest sport-climbing areas on the planet — over 10,000 routes across pocketed limestone walls.',
        'Short approaches, family-friendly logistics, and a grade spread that suits beginners through 9a aspirants.',
      ),
      city: 'Pottenstein',
      country: 'Germany',
      coordinates: [11.41, 49.77],
      active: true,
    },
    label: 'frankenjura',
  })
  const locMallorca = await ensure(payload, {
    collection: 'locations',
    where: { slug: { equals: 'mallorca' } },
    data: {
      name: 'Mallorca, Spain',
      slug: 'mallorca',
      content: richText(
        'Mallorca pairs world-class sport climbing with the original psicobloc — deep-water-solo climbing above the Mediterranean.',
        'Base camps near Porto Cristo and Cala Magraner give us instant access to both single-pitch sport and DWS classics.',
      ),
      city: 'Porto Cristo',
      country: 'Spain',
      coordinates: [3.33, 39.54],
      active: true,
    },
    label: 'mallorca',
  })
  const locLabske = await ensure(payload, {
    collection: 'locations',
    where: { slug: { equals: 'labske-udoli' } },
    data: {
      name: 'Labské Údolí, Czech Republic',
      slug: 'labske-udoli',
      content: richText(
        'Sandstone towers of the Elbe valley — the cradle of Czech climbing tradition. Knots-only protection, slings, and a strong on-sight ethic.',
        'Iconic objectives from Schmilka to Dolní Žleb, with a community-built ethic you will not find anywhere else.',
      ),
      city: 'Děčín',
      country: 'Czech Republic',
      coordinates: [14.21, 50.78],
      active: true,
    },
    label: 'labske-udoli',
  })
  const locDolomites = await ensure(payload, {
    collection: 'locations',
    where: { slug: { equals: 'dolomites' } },
    data: {
      name: 'Dolomites, Italy',
      slug: 'dolomites',
      content: richText(
        'Multi-pitch sport on impeccable Dolomite limestone — from short cragging days at Erto to full-length routes on Cinque Torri and Tofana.',
        'Pizza, gelato, and a passeggiata between climbs included by default.',
      ),
      city: 'Cortina d’Ampezzo',
      country: 'Italy',
      coordinates: [12.14, 46.54],
      active: true,
    },
    label: 'dolomites',
  })
  const locCavallers = await ensure(payload, {
    collection: 'locations',
    where: { slug: { equals: 'cavallers' } },
    data: {
      name: 'Cavallers, Spain',
      slug: 'cavallers',
      content: richText(
        'Granite slabs and steep walls in the Catalan Pyrenees — a long-time playground for youth performance camps.',
        'Cool summer temps at altitude make it perfect when the rest of Europe is in heat-wave mode.',
      ),
      city: 'Cavallers',
      country: 'Spain',
      coordinates: [0.85, 42.59],
      active: true,
    },
    label: 'cavallers',
  })

  console.log('— post categories —')

  const OLD_SITE_CATEGORIES: [string, string][] = [
    ['Promo', 'promo'],
    ['Guest Post', 'guest-post'],
    ['Climbing Destinations', 'climbing-destinations'],
    ['Trad Climbing', 'trad-climbing'],
    ['Bouldering', 'bouldering'],
    ['Sport Climbing', 'sport-climbing'],
    ['Training', 'training'],
    ['Multi-pitch Climbing', 'multi-pitch-climbing'],
  ]
  const postCategories: Record<string, { id: number }> = {}
  for (const [name, slug] of OLD_SITE_CATEGORIES) {
    postCategories[slug] = await ensure(payload, {
      collection: 'post-categories',
      where: { slug: { equals: slug } },
      data: { name, slug },
      label: slug,
    })
  }

  console.log('— posts —')

  await ensure(payload, {
    collection: 'posts',
    where: { slug: { equals: 'ticino-switzerland-granite-perfection' } },
    data: {
      title: 'Ticino, Switzerland: Granite Perfection',
      slug: 'ticino-switzerland-granite-perfection',
      excerpt: 'Why the Ticino valleys hold some of the best granite bouldering and climbing in Europe.',
      content: richText(
        'Cresciano, Chironico, Brione — names every boulderer knows. Ticino is granite perfection an easy drive from Milan.',
        'This guide covers seasons, sectors, and where to base yourself for a week of Swiss granite.',
      ),
      category: postCategories['climbing-destinations'].id,
      author: 'Rockbusters',
      publishedAt: '2026-05-01T09:00:00.000Z',
      state: 'published',
    },
    label: 'ticino post',
  })
  await ensure(payload, {
    collection: 'posts',
    where: { slug: { equals: 'the-benefits-of-training-for-your-climbing-trip' } },
    data: {
      title: 'The Benefits of Training for Your Climbing Trip',
      slug: 'the-benefits-of-training-for-your-climbing-trip',
      excerpt: 'Show up strong: a short primer on preparing your fingers, core, and head for a week on rock.',
      content: richText(
        'A climbing trip rewards preparation. Six weeks of structured fingerboard and capacity work changes what you take home from it.',
        'Here is the minimal plan we recommend to every camp participant.',
      ),
      category: postCategories['training'].id,
      author: 'Rockbusters',
      publishedAt: '2026-05-15T09:00:00.000Z',
      state: 'published',
    },
    label: 'training post',
  })

  console.log('— airports —')

  const airNUE = await ensure(payload, {
    collection: 'airports',
    where: { iata: { equals: 'NUE' } },
    data: { name: 'Nuremberg', iata: 'NUE', country: 'Germany', continent: 'Europe', size: 2, active: true },
    label: 'NUE',
  })
  const airPMI = await ensure(payload, {
    collection: 'airports',
    where: { iata: { equals: 'PMI' } },
    data: { name: 'Palma de Mallorca', iata: 'PMI', country: 'Spain', continent: 'Europe', size: 3, active: true },
    label: 'PMI',
  })
  const airPRG = await ensure(payload, {
    collection: 'airports',
    where: { iata: { equals: 'PRG' } },
    data: { name: 'Prague Václav Havel', iata: 'PRG', country: 'Czech Republic', continent: 'Europe', size: 3, active: true },
    label: 'PRG',
  })
  const airVCE = await ensure(payload, {
    collection: 'airports',
    where: { iata: { equals: 'VCE' } },
    data: { name: 'Venice Marco Polo', iata: 'VCE', country: 'Italy', continent: 'Europe', size: 3, active: true },
    label: 'VCE',
  })
  const airBCN = await ensure(payload, {
    collection: 'airports',
    where: { iata: { equals: 'BCN' } },
    data: { name: 'Barcelona El Prat', iata: 'BCN', country: 'Spain', continent: 'Europe', size: 4, active: true },
    label: 'BCN',
  })
  // keep airBCN around for potential future Cavallers events
  void airBCN

  console.log('— guides —')

  const guideKlemen = await ensure(payload, {
    collection: 'guides',
    where: { slug: { equals: 'klemen-becan' } },
    data: {
      name: 'Klemen Bečan',
      slug: 'klemen-becan',
      email: 'klemen@rockbusters.net',
      content: richText(
        'Slovenian sport-climbing veteran with first ascents up to 9a and two decades of coaching. Lead coach for the Performance Lab series.',
      ),
      active: true,
      featured: true,
    },
    label: 'klemen-becan',
  })
  const guideMarek = await ensure(payload, {
    collection: 'guides',
    where: { slug: { equals: 'marek-novak' } },
    data: {
      name: 'Marek Novák',
      slug: 'marek-novak',
      email: 'marek@rockbusters.net',
      content: richText(
        'Czech IFMGA-aspirant and movement coach. Runs the Knots & Stone trad weeks and youth Rock Lab.',
      ),
      active: true,
    },
    label: 'marek-novak',
  })
  const guideJany = await upsert(payload, {
    collection: 'guides',
    where: { slug: { equals: 'jany' } },
    data: {
      name: 'Jany Novotný',
      slug: 'jany',
      role: 'Founder & Head Coach',
      section: 'team',
      active: true,
      featured: true,
      isFounder: true,
      heroSub:
        '25 years on rock, one relentless mission: help you climb better, harder, and more. Jany founded Rockbusters and still coaches every discipline himself — from first lead to your hardest redpoint.',
      heroCaption: 'Jany · Pince Sans Rire 7b+',
      stats: [
        { value: '25+', label: 'Years Climbing & Coaching' },
        { value: '8b+', label: 'Personal Redpoint Grade' },
        { value: '5', label: 'Disciplines Coached' },
        { value: '1', label: 'Founder & Head Coach' },
      ],
      content: richText(
        'Jany trained in Social Politics and Social Work, but the mountains kept calling louder than any career path could. So he built one out of climbing instead — founding Rockbusters (and its sister project, Snowbusters) to turn two decades of guiding and coaching into a full-time mission.',
        "He's been coaching climbers and skiers since he was twenty, and the throughline across every course he's run is simple: find your real limit, then help you push past it. His style is direct — not everyone's cup of tea, by his own admission — but it's built countless strong climbers and just as many genuine friendships along the way.",
        "Whether you're learning to lead for the first time or chasing your next redpoint grade, Jany brings the same technical precision and mental coaching to every session, on rock all across Europe.",
      ),
      about: {
        headline: 'CLIMB\nBETTER,\nHARDER,\n*MORE.*',
        facts: [
          { label: 'Residence', value: 'Ústí nad Labem, CZ' },
          { label: 'Years Climbing', value: '25' },
          { label: 'Role', value: 'Founder & Head Coach' },
          { label: 'Best Redpoint', value: '8b+' },
          { label: 'Coaches', value: 'Sport, Boulder, Multi-Pitch, DWS' },
        ],
        quote:
          'My goal is to find your boundaries and help you smash right through them. It might get tough at times — but with the right technical know-how and mental coaching, no goal is out of reach.',
        quoteAttribution: '— Jany, on how he coaches',
      },
      coaching: {
        intro:
          "From first footwork to fear management, Jany's coaching covers the full technical and mental range a climber needs to progress safely and quickly.",
        pillars: [
          {
            title: 'Technique, Basic to Advanced',
            body: 'Footwork, balance, and handhold use through to sidesteps, drop-knees, flagging, heel/toe hooks, and no-hand rests.',
          },
          {
            title: 'Mental Coaching',
            body: 'Reaching and overcoming individual limits, plus dedicated fear management for climbers stuck below their real potential.',
          },
          {
            title: 'Climbing Safety',
            body: 'Belaying and lead belaying, anchor set-up, lead climbing technique, spotting, and reading outdoor climbing risk.',
          },
          {
            title: 'Send Tactics',
            body: 'Onsight, flash, and redpoint strategy — plus the deep water solo–specific safety, technique, and tricks few coaches teach.',
          },
        ],
      },
      achievements: {
        intro: 'A working coach who still climbs at the sharp end — recent redpoints across Spain and France.',
        items: [
          { route: 'Botanic', location: 'Rodellar, Spain', grade: '8b+' },
          { route: 'Spirit Rebel', location: 'Rodellar, Spain', grade: '8b' },
          { route: 'Mal de Amores', location: 'Rodellar, Spain', grade: '8a+' },
          { route: 'Montserrat', location: 'Rodellar, Spain', grade: '8a+' },
          { route: 'Tirali Valent', location: 'Sella, Spain', grade: '8a+' },
          { route: 'La Forqueta del Diablo', location: 'Sella, Spain', grade: '8a+' },
          { route: 'Les Ailes du Désir, L1–L2', location: 'Gorges du Tarn, France', grade: '8a' },
          { route: 'Teuchipa', location: 'Céüse, France', grade: '7c' },
        ],
      },
      testimonial: {
        quote:
          "Jany pushed me far beyond what I thought were my limits and made me fall even more in love with climbing. I went from 6C to 7C on that trip — and made friends I'll keep for life along the way.",
        name: 'Carmen Macgee',
        tripLine: 'Rockbusters Road Trip Client',
      },
    },
    label: 'jany',
  })
  void guideJany

  console.log('— events —')

  const evSport = await upsert(payload, {
    collection: 'events',
    where: { slug: { equals: 'sport-climbing-basics' } },
    data: {
      title: 'Sport Climbing Basics — Learn to Lead & Climb Outdoors',
      slug: 'sport-climbing-basics',
      shortDescription:
        'A week in the Frankenjura that turns indoor climbers into confident, safe outdoor leaders.',
      content: richText(
        'Seven days of pure outdoor focus: anchors, lead-falling, route reading, and tactics — guided by coaches who run beginner courses every season.',
        'You will leave able to lead, clean, and belay outdoors with confidence, and with a list of follow-up crags within your driving range.',
      ),
      state: 'published',
      featured: true,
      categories: [catCamps.id],
      programs: [programCamps.id],
      difficulties: [dBeg.id, dInt.id],
      locations: [locFrankenjura.id],
      coaches: [guideKlemen.id, guideMarek.id],
      transport: { airports: [airNUE.id] },
      highlights: [
        { text: 'Seven full days on rock' },
        { text: 'Up to 4 climbers per coach' },
        { text: 'All technical gear provided' },
      ],
      audienceCards: [
        {
          heading: 'Confident indoor climber',
          body: 'You lead in the gym but the outdoor transition is missing.',
          highlighted: false,
        },
        {
          heading: 'Returning climber',
          body: 'You climbed years ago and want a structured reboot.',
          highlighted: true,
        },
      ],
      prerequisites: [
        { text: 'Climb 5+ (UIAA) indoor lead comfortably' },
        { text: 'Basic belay and tie-in skills' },
      ],
    },
    label: 'sport-climbing-basics',
  })

  const evDeepBlue = await upsert(payload, {
    collection: 'events',
    where: { slug: { equals: 'deep-blue-psicobloc' } },
    data: {
      title: 'DEEP BLUE — The Psicobloc Camp',
      slug: 'deep-blue-psicobloc',
      shortDescription:
        'Mallorca: deep-water solo above the Mediterranean, paired with bolted sport climbing as a warm-up.',
      content: richText(
        'Psicobloc — climbing without rope above deep water — is the most pure, most fun expression of the sport. We line up the best classics on Mallorca and pair the DWS days with bolted sport pitches when the swell is up.',
        'Bring board shorts. Coaches handle the rest: route selection, swell forecasts, swim-out logistics, and a safety briefing that never gets old.',
      ),
      state: 'published',
      featured: true,
      categories: [catCamps.id],
      programs: [programCamps.id],
      difficulties: [dInt.id, dAdv.id],
      locations: [locMallorca.id],
      coaches: [guideKlemen.id],
      transport: { airports: [airPMI.id] },
      highlights: [
        { text: 'DWS classics on Cala Magraner / Cova del Diablo' },
        { text: 'Backup sport days at S’Estret' },
        { text: 'Small group (max 5)' },
      ],
      audienceCards: [
        {
          heading: 'Solid 6c+ leader',
          body: 'You are comfortable on overhangs and not afraid of committing moves above water.',
          highlighted: true,
        },
        {
          heading: 'Adventure-first',
          body: 'You want a holiday that doubles as a story to tell.',
          highlighted: false,
        },
      ],
      prerequisites: [
        { text: 'Confident swimmer' },
        { text: 'Lead 6c+ outdoors on bolted sport' },
      ],
    },
    label: 'deep-blue-psicobloc',
  })

  const evDolomites = await upsert(payload, {
    collection: 'events',
    where: { slug: { equals: 'dolomite-dolce-vita' } },
    data: {
      title: 'The Dolomite Dolce Vita',
      slug: 'dolomite-dolce-vita',
      shortDescription:
        'Two-week Dolomites tour — multi-pitch sport, alpine rest days, and a lot of espresso.',
      content: richText(
        'A fortnight of pure dolce vita: long bolted multi-pitches at Cinque Torri and Tofana, cragging at Erto on the recovery days, and a guesthouse base in Cortina with a hot-tub and a baker downstairs.',
        'Pace is set by the group. Pizza nights are non-negotiable.',
      ),
      state: 'published',
      categories: [catCamps.id],
      programs: [programCamps.id],
      difficulties: [dInt.id, dAdv.id],
      locations: [locDolomites.id],
      coaches: [guideKlemen.id, guideMarek.id],
      transport: { airports: [airVCE.id] },
      highlights: [
        { text: '14 days, climbing-on-demand schedule' },
        { text: 'Multi-pitch + cragging mix' },
        { text: 'Hot-tub at the guesthouse' },
      ],
      audienceCards: [
        {
          heading: 'Multi-pitch curious',
          body: 'You have led single-pitch sport and want to try long routes.',
          highlighted: false,
        },
        {
          heading: 'Holiday climbers',
          body: 'You want serious climbing but also a real holiday.',
          highlighted: true,
        },
      ],
      prerequisites: [
        { text: 'Lead 6a+ outdoors on bolted sport' },
        { text: 'Basic multi-pitch (or willingness to learn)' },
      ],
    },
    label: 'dolomite-dolce-vita',
  })

  // Unused holders are still exported so future seeds can use them.
  void locCavallers
  void locLabske

  console.log('— event dates —')

  type DateRow = {
    event: number
    dateFrom: string
    dateTo: string
    price: number
    capacity: number
    currency: 'EUR' | 'CZK'
    locations?: number[]
    guides?: number[]
    airportFrom?: number
    airportTo?: number
  }

  const dates: DateRow[] = [
    // sport-climbing-basics — 1 date
    {
      event: evSport.id,
      dateFrom: '2026-06-06',
      dateTo: '2026-06-13',
      price: 950,
      capacity: 8,
      currency: 'EUR',
      locations: [locFrankenjura.id],
      guides: [guideKlemen.id, guideMarek.id],
      airportFrom: airNUE.id,
      airportTo: airNUE.id,
    },
    // deep-blue-psicobloc — 2 dates
    {
      event: evDeepBlue.id,
      dateFrom: '2026-06-06',
      dateTo: '2026-06-13',
      price: 990,
      capacity: 5,
      currency: 'EUR',
      locations: [locMallorca.id],
      guides: [guideKlemen.id],
      airportFrom: airPMI.id,
      airportTo: airPMI.id,
    },
    {
      event: evDeepBlue.id,
      dateFrom: '2026-09-12',
      dateTo: '2026-09-19',
      price: 1050,
      capacity: 5,
      currency: 'EUR',
      locations: [locMallorca.id],
      guides: [guideKlemen.id],
      airportFrom: airPMI.id,
      airportTo: airPMI.id,
    },
    // dolomite-dolce-vita — 3 dates
    {
      event: evDolomites.id,
      dateFrom: '2026-06-27',
      dateTo: '2026-07-11',
      price: 1990,
      capacity: 6,
      currency: 'EUR',
      locations: [locDolomites.id],
      guides: [guideKlemen.id, guideMarek.id],
      airportFrom: airVCE.id,
      airportTo: airVCE.id,
    },
    {
      event: evDolomites.id,
      dateFrom: '2026-08-08',
      dateTo: '2026-08-22',
      price: 1990,
      capacity: 6,
      currency: 'EUR',
      locations: [locDolomites.id],
      guides: [guideKlemen.id],
      airportFrom: airVCE.id,
      airportTo: airVCE.id,
    },
    {
      event: evDolomites.id,
      dateFrom: '2026-09-05',
      dateTo: '2026-09-19',
      price: 1990,
      capacity: 6,
      currency: 'EUR',
      locations: [locDolomites.id],
      guides: [guideKlemen.id, guideMarek.id],
      airportFrom: airVCE.id,
      airportTo: airVCE.id,
    },
  ]

  for (const row of dates) {
    await ensure(payload, {
      collection: 'event-dates',
      where: {
        and: [{ event: { equals: row.event } }, { dateFrom: { equals: row.dateFrom } }],
      },
      data: { ...row, vat: 0, minParticipants: 2, active: true },
      label: `event#${row.event} from ${row.dateFrom}`,
    })
  }

  console.log('— reviews —')

  const reviews: Array<{
    slugTag: string
    quote: string
    reviewerName: string
    reviewerLocation: string
    resultLine: string
    event?: number
    program?: number
    position: number
  }> = [
    {
      slugTag: 'frankenjura-review-1',
      quote:
        'Showed up able to lead in the gym, left having on-sighted my first 6a outside. The coaches make outdoor climbing feel obvious instead of scary.',
      reviewerName: 'Lucie K.',
      reviewerLocation: 'Brno, CZ',
      resultLine: 'First outdoor 6a — on-sight.',
      event: evSport.id,
      position: 1,
    },
    {
      slugTag: 'mallorca-review-1',
      quote:
        'Psicobloc had been on my list for ten years. The Rockbusters crew made it click on day two. Now I cannot stop.',
      reviewerName: 'Mark T.',
      reviewerLocation: 'Manchester, UK',
      resultLine: 'Sent my first 7a DWS.',
      event: evDeepBlue.id,
      position: 1,
    },
    {
      slugTag: 'dolomites-review-1',
      quote:
        'Two weeks of climbing-on-demand with the best espresso in the village. Klemen tailored every day to whatever my partner and I felt like.',
      reviewerName: 'Hana & Petr',
      reviewerLocation: 'Praha, CZ',
      resultLine: 'First Tofana multi-pitch.',
      event: evDolomites.id,
      position: 1,
    },
    {
      slugTag: 'global-review-1',
      quote:
        'Four camps in three years. The coaching depth is what brings me back — there is always a new thing to drill.',
      reviewerName: 'Andrej M.',
      reviewerLocation: 'Bratislava, SK',
      resultLine: 'Repeat camper since 2023.',
      program: programCamps.id,
      position: 2,
    },
  ]

  for (const r of reviews) {
    const { slugTag, ...data } = r
    await ensure(payload, {
      collection: 'reviews',
      where: { reviewerName: { equals: r.reviewerName }, quote: { equals: r.quote } },
      data: { ...data, active: true },
      label: slugTag,
    })
  }

  console.log('— faqs —')

  const faqs: Array<{
    tag: string
    question: string
    answer: ReturnType<typeof richText>
    event?: number
    program?: number
    position: number
  }> = [
    {
      tag: 'global-gear',
      question: 'Do I need to bring my own gear?',
      answer: richText(
        'Bring your own shoes, harness, and chalk bag. Rope, quickdraws, helmet, and all group safety equipment is provided. If you do not own a harness yet we can loan one — just tell us your size when you book.',
      ),
      position: 1,
    },
    {
      tag: 'global-fitness',
      question: 'How fit do I need to be?',
      answer: richText(
        'Fit enough to climb most of the day with breaks. We design rest days into every camp and tailor the volume to the group — nobody gets dragged.',
      ),
      position: 2,
    },
    {
      tag: 'global-solo-traveller',
      question: 'I am travelling solo — will I be partnered up?',
      answer: richText(
        'Yes. Most of our camps are full of solo climbers. Coaches handle pairings and rotate partners so you get coached, not babysat.',
      ),
      position: 3,
    },
    {
      tag: 'sport-basics-prereq',
      question: 'Is this beginner-friendly if I have only ever climbed indoors?',
      answer: richText(
        'Absolutely — that is exactly who this camp is for. You should be comfortable belaying and leading 5+ on indoor lead, and we take it from there.',
      ),
      event: evSport.id,
      position: 1,
    },
    {
      tag: 'deep-blue-swim',
      question: 'How much swimming is involved?',
      answer: richText(
        'You will swim out from the boat or shore to most starts (5–50m) and swim back after each fall. Be a confident swimmer in open water — fins are provided.',
      ),
      event: evDeepBlue.id,
      position: 1,
    },
    {
      tag: 'dolomites-multipitch',
      question: 'I have never done a multi-pitch — is that OK?',
      answer: richText(
        'Yes. The first morning is a multi-pitch primer: anchor management, rope-work, communication. By the end of day one most groups are doing 4-pitch routes confidently.',
      ),
      event: evDolomites.id,
      position: 1,
    },
  ]

  for (const f of faqs) {
    const { tag, ...data } = f
    await ensure(payload, {
      collection: 'faqs',
      where: { question: { equals: f.question } },
      data: { ...data, active: true },
      label: tag,
    })
  }

  console.log('— cms pages —')

  const demoMedia = await ensureMedia(payload, {
    filename: BLOCK_DEMO_MEDIA_FILENAME,
    alt: 'Climber on a Rockbusters course',
    label: BLOCK_DEMO_MARKER,
  })

  await upsert(payload, {
    collection: 'pages',
    where: { slug: { equals: BLOCK_DEMO_PAGE_SLUG } },
    data: {
      title: 'CMS Page Builder POC',
      slug: BLOCK_DEMO_PAGE_SLUG,
      status: 'published',
      seo: {
        title: 'CMS Page Builder POC - Rockbusters',
        description:
          'A Payload CMS composed page proving reusable React blocks and safe data bindings.',
      },
      layout: [
        {
          blockType: 'hero',
          eyebrow: 'Payload CMS page builder',
          heading: 'Build campaign pages from approved blocks',
          body:
            'This page is seeded from Payload and rendered by reusable React blocks, not hardcoded route composition.',
          variant: 'simple',
          primaryAction: {
            label: 'View trips',
            href: '/programs',
          },
        },
        {
          blockType: 'tripGrid',
          eyebrow: 'Data-bound trips',
          heading: 'Manually curated trips resolved from Events',
          intro:
            'Editors choose approved Event relationships; the app resolves published Events and active Event Dates.',
          source: 'manual',
          events: [evSport.id, evDeepBlue.id, evDolomites.id],
          limit: 3,
          variant: 'cards',
        },
        {
          blockType: 'mediaBlock',
          eyebrow: 'Media relationship',
          heading: 'Payload media drives the visual block',
          body:
            'The block stores a relationship to the Media collection while React owns sizing, alt text, and responsive rendering.',
          source: 'upload',
          media: demoMedia.id,
          caption: 'Seeded media fixture for the CMS page-builder proof of concept.',
          variant: 'contained',
        },
        {
          blockType: 'faq',
          eyebrow: 'Reusable answers',
          heading: 'Global FAQs from the FAQ collection',
          source: 'global',
          limit: 3,
          variant: 'twoColumn',
        },
        {
          blockType: 'cta',
          eyebrow: 'Editor-managed CTA',
          heading: 'One reusable call to action, many pages',
          body:
            'The CMS controls copy and links; the design system controls layout, accessibility, and visual consistency.',
          variant: 'red',
          primaryAction: {
            label: 'Open admin',
            href: '/admin/collections/pages',
          },
          secondaryAction: {
            label: 'See homepage',
            href: '/',
          },
        },
      ],
    },
    label: BLOCK_DEMO_MARKER,
  })

  console.log('\nseed complete.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('seed failed:', err)
    process.exit(1)
  })
