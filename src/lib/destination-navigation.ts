import type { Location } from '@/payload-types'

// Match the default destination block renderers, including their empty states.
export function destinationJumpNavItems(loc: Pick<Location, 'destinationDetail'>) {
  const detail = loc.destinationDetail
  if (!detail) return []

  const hasSection = (key: string) => detail.sections?.some((section) => section.key === key && section.heading)
  const hasItems = (items: unknown[] | null | undefined) => Boolean(items?.length)
  const item = (anchorId: string, label: string, show: boolean) =>
    show ? { href: `#${anchorId}`, label } : null

  return [
    item('destination-intro', 'Introduction', Boolean(hasSection('intro'))),
    item('destination-history', 'History', Boolean(hasSection('history'))),
    item('destination-rock', 'Rock & style', Boolean(hasSection('rock'))),
    item('who-is-it-for', 'Who is it for', hasItems(detail.audience)),
    item(
      hasSection('grades') ? 'destination-grades' : 'grades-sectors',
      hasItems(detail.sectors) ? 'Grades & sectors' : 'Grades',
      Boolean(hasSection('grades')) || hasItems(detail.sectors),
    ),
    item('best-season', 'Best season', Boolean(detail.seasonMonths?.some((month) => month.label && typeof month.score === 'number'))),
    item('gear', 'Gear', Boolean(detail.gearGroups?.some((group) => group.items?.length))),
    item('getting-there', 'Getting there', hasItems(detail.transportOptions)),
    item('stay-eat', 'Stay & eat', hasItems(detail.accommodationOptions)),
    item('rest-days', 'Rest days', hasItems(detail.restDayIdeas)),
    item('tips-ethics', 'Tips & ethics', hasItems(detail.accessRules)),
    item('safety', 'Safety', hasItems(detail.safetyItems)),
    item('costs', 'Costs', hasItems(detail.costItems)),
    item('faq', 'FAQ', hasItems(detail.destinationFaqs)),
    item('rockbusters-trips', 'Rockbusters trips', hasItems(detail.tripPromos)),
  ].filter((navItem): navItem is { href: string; label: string } => Boolean(navItem))
}
