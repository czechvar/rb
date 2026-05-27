import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{6,20}$/, 'Enter a valid phone number.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})
