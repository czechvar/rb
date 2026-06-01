import { z } from 'zod'

const participantSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^\+?[\d\s\-()]{6,20}$/, 'Valid phone required'),
})

export const bookingSchema = z.object({
  participants: z.array(participantSchema).min(1, 'At least one participant required'),
  addressIndex: z.coerce.number().int().nonnegative('Choose a billing address'),
  customerNote: z.string().max(2000).optional(),
})

export type BookingInput = z.infer<typeof bookingSchema>
