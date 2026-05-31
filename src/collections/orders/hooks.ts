import type { CollectionBeforeValidateHook, CollectionBeforeChangeHook } from 'payload'

/**
 * On create only: compute participantCount from participants.length and
 * totalPrice from unitPrice * participantCount. On update we leave both alone
 * (they're readOnly in admin and immutable by contract).
 */
export const deriveCountsAndTotal: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (operation !== 'create' || !data) return data
  const participants = Array.isArray((data as { participants?: unknown[] }).participants)
    ? ((data as { participants: unknown[] }).participants as unknown[])
    : []
  const participantCount = participants.length
  const unitPrice = Number((data as { unitPrice?: unknown }).unitPrice ?? 0)
  return {
    ...data,
    participantCount,
    totalPrice: unitPrice * participantCount,
  }
}

/**
 * On create only: allocate the next orderNumber inside the active transaction.
 * Format RB-YYYY-NNNNNN (zero-padded). Uses payload.find with descending sort
 * over today's year prefix to find the largest taken number. The unique index
 * on orderNumber catches the rare race; the caller should retry.
 */
export const allocateOrderNumber: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const year = new Date().getUTCFullYear()
  const prefix = `RB-${year}-`
  const recent = await req.payload.find({
    collection: 'orders',
    where: { orderNumber: { like: prefix } },
    sort: '-orderNumber',
    limit: 1,
    depth: 0,
    req,
  })
  const last = recent.docs[0] as { orderNumber?: string } | undefined
  const nextSeq = last?.orderNumber
    ? Number(last.orderNumber.slice(prefix.length)) + 1
    : 1
  const orderNumber = `${prefix}${String(nextSeq).padStart(6, '0')}`
  return { ...data, orderNumber }
}

/**
 * Stamp newly-added notes with author = req.user.id and createdAt = now.
 * Runs on create + update. Existing notes (with both fields set) are left
 * alone. Field-level access prevents non-admins from writing notes at all.
 */
export const stampNotes: CollectionBeforeChangeHook = ({ data, req }) => {
  if (!data) return data
  const notes = (data as { notes?: unknown[] }).notes
  if (!Array.isArray(notes)) return data
  const now = new Date().toISOString()
  const stamped = notes.map((n) => {
    const note = n as Record<string, unknown>
    if (note.createdAt && note.author) return note
    return {
      ...note,
      author: note.author ?? req.user?.id,
      createdAt: note.createdAt ?? now,
    }
  })
  return { ...data, notes: stamped }
}
