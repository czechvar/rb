import { z } from 'zod'

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password required.'),
    password: z.string().min(8, 'At least 8 characters.'),
    confirm: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  })
  .refine((d) => d.password !== d.currentPassword, {
    message: 'New password must differ from current.',
    path: ['password'],
  })
