import type { CollectionAfterChangeHook } from 'payload'
import { siteUrl } from '../../lib/url'
import {
  bookingReceivedToUserTemplate,
  bookingReceivedToAdminTemplate,
  bookingConfirmedToUserTemplate,
  bookingCancelledToUserTemplate,
} from '../../lib/email/templates'
import type { OrderState } from './state-machine'

interface OrderLike {
  id: number | string
  orderNumber: string
  state: OrderState
  currency: string
  totalPrice: number
  participantCount: number
  user: number | { id: number; email: string; name?: string }
  eventDate: number | { id: number; dateFrom: string; dateTo: string; event?: number | { title?: string } }
}

function formatDateRange(from: string, to: string): string {
  const f = new Date(from), t = new Date(to)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${f.toLocaleDateString('en-GB', opts)} – ${t.toLocaleDateString('en-GB', opts)}`
}

export const dispatchLifecycleEmails: CollectionAfterChangeHook = async ({
  doc, previousDoc, operation, req,
}) => {
  const o = doc as OrderLike

  let userEmail: string, userName: string
  if (typeof o.user === 'object') {
    userEmail = o.user.email
    userName = o.user.name ?? 'there'
  } else {
    const u = await req.payload.findByID({ collection: 'users', id: o.user, depth: 0, req })
    userEmail = (u as { email: string }).email
    userName = (u as { name?: string }).name ?? 'there'
  }

  let eventTitle = 'Trip'
  let eventDateRange = ''
  if (typeof o.eventDate === 'object') {
    eventDateRange = formatDateRange(o.eventDate.dateFrom, o.eventDate.dateTo)
    if (typeof o.eventDate.event === 'object' && o.eventDate.event?.title) {
      eventTitle = o.eventDate.event.title
    } else if (typeof o.eventDate.event === 'number') {
      const ev = await req.payload.findByID({ collection: 'events', id: o.eventDate.event, depth: 0, req })
      eventTitle = (ev as { title?: string }).title ?? 'Trip'
    }
  } else {
    const ed = await req.payload.findByID({ collection: 'event-dates', id: o.eventDate, depth: 0, req })
    const edObj = ed as { dateFrom: string; dateTo: string; event: number }
    eventDateRange = formatDateRange(edObj.dateFrom, edObj.dateTo)
    const ev = await req.payload.findByID({ collection: 'events', id: edObj.event, depth: 0, req })
    eventTitle = (ev as { title?: string }).title ?? 'Trip'
  }

  const baseCtx = {
    name: userName,
    orderNumber: o.orderNumber,
    eventTitle, eventDate: eventDateRange,
    participantCount: o.participantCount,
    totalPrice: o.totalPrice,
    currency: o.currency,
    accountOrderUrl: siteUrl(`/account/orders/${o.id}`),
  }
  const adminEmail =
    process.env.ADMIN_ORDER_NOTIFICATIONS_EMAIL ??
    process.env.EMAIL_FROM_ADDRESS ??
    'admin@example.com'

  async function safeSend(args: { to: string; subject: string; html: string }) {
    try {
      await req.payload.sendEmail(args)
    } catch (err) {
      req.payload.logger.error({ err }, '[orders-emails] send failed')
    }
  }

  if (operation === 'create') {
    await safeSend({
      to: userEmail,
      subject: 'Booking received — Rockbusters',
      html: bookingReceivedToUserTemplate(baseCtx),
    })
    await safeSend({
      to: adminEmail,
      subject: `New booking ${o.orderNumber}`,
      html: bookingReceivedToAdminTemplate({
        orderNumber: o.orderNumber,
        userEmail,
        eventTitle,
        participantCount: o.participantCount,
        adminOrderUrl: siteUrl(`/admin/collections/orders/${o.id}`),
      }),
    })
    return doc
  }

  const prev = (previousDoc as { state?: OrderState } | undefined)?.state
  if (operation === 'update' && prev && prev !== o.state) {
    if (prev === 'pending' && o.state === 'confirmed') {
      await safeSend({
        to: userEmail,
        subject: 'Booking confirmed — Rockbusters',
        html: bookingConfirmedToUserTemplate({
          ...baseCtx,
          bankTransferDetails:
            process.env.BANK_TRANSFER_DETAILS ??
            'IBAN: TBD\nBeneficiary: TBD\n(Configure BANK_TRANSFER_DETAILS env var)',
        }),
      })
    } else if (o.state === 'cancelled') {
      await safeSend({
        to: userEmail,
        subject: 'Booking cancelled — Rockbusters',
        html: bookingCancelledToUserTemplate(baseCtx),
      })
    }
  }
  return doc
}
