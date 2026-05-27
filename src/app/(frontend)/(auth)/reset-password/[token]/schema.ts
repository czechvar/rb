import { z } from 'zod'

export const resetSchema = z
  .object({
    token: z.string().min(1, 'Missing token.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirm: z.string().min(1, 'Confirm your password.'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  })
