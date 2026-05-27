import { z } from 'zod'
export const resendSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})
