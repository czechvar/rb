import type { TripDetailView } from './trip-detail'

type TripBlock = { blockType: string; [key: string]: unknown }
/** Runtime composition uses the same registered blocks available in the CMS. */
export function defaultTripLayout(trip: TripDetailView): TripBlock[] {
  const eyebrows: Record<string, string> = { overview: 'About This Trip', audience: 'Who Should Show Up', highlights: 'Trip Highlights', learning: 'The Coaching', itinerary: 'Daily Structure', requirements: 'Requirements', equipment: 'Equipment', notes: 'Additional Information', remaining: 'More Information' }
  const content = (section: string, variant = 'prose'): TripBlock => ({ blockType: 'tripContent', section, variant, eyebrow: eyebrows[section] })
  return [
    { blockType: 'tripHero', variant: 'editorial' },
    { blockType: 'tripFacts', variant: 'heroBar' },
    content('overview', 'overview'),
    { blockType: 'tripDates', variant: 'rows', heading: 'Dates & Pricing', eyebrow: 'Other Dates' },
    { blockType: 'gallery', source: 'currentEvent', variant: 'featureLead', eyebrow: 'Trip Gallery' },
    content('audience', 'cards'),
    content('highlights', 'cards'),
    content('learning', 'cards'),
    content('itinerary', 'timeline'),
    content('requirements', 'cards'),
    { blockType: 'tripVenue', variant: 'editorial' },
    { blockType: 'tripTeam', variant: 'cards', eyebrow: 'Your Guides' },
    { blockType: 'reviewGrid', source: 'byEvent', heading: 'What Past Climbers Say', eyebrow: 'Results', limit: 50 },
    { blockType: 'tripLogistics', variant: 'cards', heading: 'Everything Sorted', eyebrow: 'Accommodation & Logistics' },
    content('equipment', 'prose'),
    content('notes', 'prose'),
    { blockType: 'faq', source: 'byEvent', heading: 'Common Questions', eyebrow: 'FAQ', variant: 'singleColumn', limit: 100 },
    ...(trip.remainingContent || trip.remainingAdditionalInfo?.length || trip.event.partner || trip.event.partnerHeadline || trip.event.partnerDescription || trip.event.partnerBenefits?.length || trip.event.demoEnabled ? [content('remaining')] : []),
    { blockType: 'tripBookingCTA', variant: 'image', heading: 'Ready to join?', eyebrow: 'Reserve Your Place' },
  ]
}
