import { z } from 'zod'

export const contactSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name.').max(120, 'Use 120 characters or fewer.'),
    email: z
      .string()
      .trim()
      .max(254, 'Enter a valid email address.')
      .email('Enter a valid email address.'),
    level: z.string().trim().max(120, 'Use 120 characters or fewer.').default(''),
    interest: z.string().trim().max(120, 'Use 120 characters or fewer.').default(''),
    message: z
      .string()
      .trim()
      .min(1, 'Enter your message.')
      .max(5000, 'Use 5,000 characters or fewer.'),
    preferredContact: z.enum(['email', 'phone', 'whatsapp']),
    phone: z.string().trim().max(40, 'Enter a valid phone number.').default(''),
  })
  .superRefine((value, ctx) => {
    if (value.preferredContact === 'email') return
    const digits = value.phone.replace(/\D/g, '')
    if (!/^\+?[\d\s()-]+$/.test(value.phone) || digits.length < 7 || digits.length > 15) {
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'Enter a phone number with country code for your chosen reply method.',
      })
    }
  })
  .transform((value) => ({
    ...value,
    phone: value.preferredContact === 'email' ? '' : value.phone,
  }))

export type ContactEnquiry = z.infer<typeof contactSchema>
