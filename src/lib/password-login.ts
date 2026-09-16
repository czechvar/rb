import { z } from 'zod'
import type { ActionResult } from '@/components/forms/action-result'
import { setPayloadSession } from '@/lib/auth-session'
import { getPayloadClient } from '@/lib/payload'

const passwordLoginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export async function authenticateWithPassword(input: {
  email: FormDataEntryValue | null
  password: FormDataEntryValue | null
}): Promise<ActionResult> {
  const parsed = passwordLoginSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      ),
    }

  const { email, password } = parsed.data
  try {
    const result = await (
      await getPayloadClient()
    ).login({
      collection: 'users',
      data: { email, password },
    })
    if (!result.token) return { ok: false, formError: 'Login failed — no token returned.' }
    await setPayloadSession(result.token)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/verify/i.test(message) && /(account|email)/i.test(message))
      return { ok: false, formError: `verify_required:${email}` }
    if (/locked/i.test(message))
      return {
        ok: false,
        formError:
          'Account temporarily locked. Try again in ~10 minutes or reset your password.',
      }
    return { ok: false, formError: 'Invalid email or password.' }
  }
}
