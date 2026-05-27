import { z } from 'zod'

export const addressSchema = z
  .object({
    label: z.string().optional(),
    isDefault: z
      .union([z.literal('on'), z.literal('off'), z.string().length(0)])
      .optional()
      .transform((v) => v === 'on'),
    firstName: z.string().min(1, 'First name required.'),
    lastName: z.string().min(1, 'Last name required.'),
    street: z.string().min(1, 'Street required.'),
    city: z.string().min(1, 'City required.'),
    postalCode: z.string().min(1, 'Postal code required.'),
    country: z.string().min(1, 'Country required.'),
    companyName: z.string().optional(),
    ico: z.string().optional(),
    dic: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.companyName) {
      if (d.ico && !/^\d{8}$/.test(d.ico)) {
        ctx.addIssue({ code: 'custom', path: ['ico'], message: 'IČO must be 8 digits.' })
      }
      if (d.dic && !/^CZ\d{8,10}$/.test(d.dic)) {
        ctx.addIssue({ code: 'custom', path: ['dic'], message: 'DIČ must be CZ + 8–10 digits.' })
      }
    }
  })
