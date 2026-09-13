'use server'

import { headers } from 'next/headers'
import type { ActionResult } from '@/components/forms/action-result'
import { contactNetwork, intakeContact, parseContactInput } from '@/lib/contact/intake'

export async function submitContactAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    if (formData.get('website'))
      return {
        ok: false,
        formError: 'Your enquiry could not be saved. Please contact us directly.',
      }
    const parsed = parseContactInput(formData)
    if (!parsed.success)
      return {
        ok: false,
        fieldErrors: Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      }
    const { getPayloadClient } = await import('@/lib/payload')
    return await intakeContact(
      formData,
      await getPayloadClient(),
      contactNetwork(await headers(), process.env.VERCEL === '1'),
      process.env.PAYLOAD_SECRET ?? '',
    )
  } catch {
    return {
      ok: false,
      formError: 'Your enquiry could not be saved. Please try again or contact us directly.',
    }
  }
}
