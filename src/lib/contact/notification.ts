import type { Payload } from 'payload'
import { z } from 'zod'
import { resolveEmailMode, type EmailMode } from '@/lib/email/adapter'
import type { ContactEnquiry } from './schema'

type SavedEnquiry = ContactEnquiry & { id: number }
type NotificationOptions = { mode?: EmailMode; recipient?: string }

/** Best-effort notification of an already durable record; never called on edits or retries. */
export async function notifyContact(
  payload: Payload,
  enquiry: SavedEnquiry,
  options: NotificationOptions = {},
): Promise<void> {
  let notificationStatus: 'sent' | 'failed' | 'notConfigured' = 'notConfigured'
  let notifiedAt: string | undefined
  try {
    const mode = options.mode ?? resolveEmailMode()
    // The shared console adapter prints message contents. Never pass visitor content to it.
    if (mode !== 'console') {
      let recipient = options.recipient ?? process.env.CONTACT_ENQUIRY_EMAIL
      if (!recipient?.trim()) {
        const pages = await payload.find({
          collection: 'pages',
          where: { and: [{ slug: { equals: 'contact' } }, { status: { equals: 'published' } }] },
          depth: 0,
          limit: 1,
          overrideAccess: false,
        })
        const details = pages.docs[0]?.layout?.find(
          (block) => block.blockType === 'contact-details',
        )
        recipient = details?.blockType === 'contact-details' ? details.email : undefined
      }
      const address = z.string().trim().max(254).email().safeParse(recipient)
      if (address.success) {
        await payload.sendEmail({
          to: address.data,
          replyTo: enquiry.email,
          subject: `Rockbusters contact enquiry #${enquiry.id}`,
          text: [
            `A contact enquiry has been saved in Payload (#${enquiry.id}).`,
            `Name: ${enquiry.name}`,
            `Email: ${enquiry.email}`,
            `Preferred reply: ${enquiry.preferredContact}`,
            ...(enquiry.phone ? [`Phone: ${enquiry.phone}`] : []),
            `Climbing level: ${enquiry.level || 'Not specified'}`,
            `Interest: ${enquiry.interest || 'Not specified'}`,
            '',
            enquiry.message,
          ].join('\n'),
        })
        notificationStatus = 'sent'
        notifiedAt = new Date().toISOString()
      }
    }
  } catch {
    notificationStatus = 'failed'
  }
  try {
    await payload.update({
      collection: 'contact-enquiries',
      id: enquiry.id,
      data: { notificationStatus, ...(notifiedAt ? { notifiedAt } : {}) },
      overrideAccess: true,
    })
  } catch {
    // The saved enquiry remains authoritative. Pending means confirmation was not persisted.
    // Do not log provider errors or automatically resend a potentially delivered message.
  }
}
