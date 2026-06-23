import type { CollectionBeforeValidateHook, CollectionBeforeChangeHook } from 'payload'

/**
 * On create only: compute participantCount from participants.length,
 * apply the snowbusters discount stacking rule, and derive totalPrice,
 * discountAmount, and commission fields. On update we leave all alone
 * (they're readOnly in admin and immutable by contract).
 *
 * Snowbusters stacking rule:
 * - If discountCode is set, it wins on price (discountPercent takes precedence)
 *   and records its commission.
 * - If referral is set (and no discountCode), it applies discount and records commission.
 * - If both are set, discountCode applies the discount, but referral commission
 *   is ALSO recorded (both commissions are paid out).
 * - discountAmount and totalPrice are based on basePrice = unitPrice * participantCount.
 */
export const deriveCountsAndTotal: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data
  const d = data as {
    participants?: unknown[]
    unitPrice?: unknown
    discountCode?: number | null
    referral?: number | null
  }
  const participants = Array.isArray(d.participants) ? d.participants : []
  const participantCount = participants.length
  const unitPrice = Number(d.unitPrice ?? 0)
  const basePrice = unitPrice * participantCount

  let dc: { discountPercent: number; commissionPercent?: number | null } | null = null
  if (d.discountCode) {
    dc = (await req.payload.findByID({
      collection: 'discount-codes',
      id: d.discountCode,
      depth: 0,
      req,
    })) as never
  }

  let ref: { discountPercent: number; commissionPercent: number } | null = null
  if (d.referral) {
    ref = (await req.payload.findByID({
      collection: 'referrals',
      id: d.referral,
      depth: 0,
      req,
    })) as never
  }

  // Snowbusters stacking rule: discount-code wins on price; referral commission always tracked.
  const discountPercent = dc ? dc.discountPercent : ref ? ref.discountPercent : 0
  const discountAmount = Math.round((basePrice * discountPercent) / 100)
  const totalPrice = basePrice - discountAmount
  const discountCommission = dc
    ? Math.round((basePrice * (dc.commissionPercent ?? 0)) / 100)
    : 0
  const referralCommission = ref
    ? Math.round((basePrice * ref.commissionPercent) / 100)
    : 0

  return {
    ...data,
    participantCount,
    totalPrice,
    discountAmount,
    discountCommission,
    referralCommission,
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
  const lastSeq = last?.orderNumber ? Number(last.orderNumber.slice(prefix.length)) : 0
  const nextSeq = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1
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
