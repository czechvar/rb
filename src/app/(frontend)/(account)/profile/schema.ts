import { z } from 'zod'

export const profileSchema = z
  .object({
    name: z.string().min(1, 'Name is required.'),
    phone: z.string().regex(/^\+?[\d\s\-()]{6,20}$/, 'Enter a valid phone number.'),
    email: z.string().email('Enter a valid email address.'),
    currentEmail: z.string().email(),
    currentPassword: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.email !== d.currentEmail) {
      if (!d.currentPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['currentPassword'],
          message: 'Confirm your current password to change your email.',
        })
      }
    }
  })
