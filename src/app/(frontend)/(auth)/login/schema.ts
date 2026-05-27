// src/app/(frontend)/(auth)/login/schema.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  from: z.string().optional(),
})
export type LoginInput = z.infer<typeof loginSchema>
