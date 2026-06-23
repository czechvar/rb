'use server'

import { getPayloadClient } from '@/lib/payload'

export type ValidateDiscountResult =
  | {
      ok: true
      id: number
      code: string
      title: string
      description: string | null
      discountPercent: number
    }
  | { ok: false; message: string }

export async function validateDiscountCodeAction(input: {
  code: string
  eventDateId: number
}): Promise<ValidateDiscountResult> {
  const code = (input.code ?? '').trim().toUpperCase()
  if (!code) return { ok: false, message: 'Enter a code.' }

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'discount-codes',
    where: { and: [{ code: { equals: code } }, { active: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  const dc = docs[0] as
    | {
        id: number
        code: string
        title: string
        description?: string | null
        discountPercent: number
        validFrom: string
        validUntil: string
      }
    | undefined
  if (!dc) return { ok: false, message: 'This code is not valid.' }

  const now = new Date()
  // Date-only comparison: compare YYYY-MM-DD strings to avoid TZ surprises.
  const today = now.toISOString().slice(0, 10)
  const from = dc.validFrom.slice(0, 10)
  const until = dc.validUntil.slice(0, 10)
  if (today < from) return { ok: false, message: 'This code is not yet active.' }
  if (today > until) return { ok: false, message: 'This code has expired.' }

  return {
    ok: true,
    id: dc.id,
    code: dc.code,
    title: dc.title,
    description: dc.description ?? null,
    discountPercent: dc.discountPercent,
  }
}
