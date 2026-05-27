import { z } from 'zod';

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  document: z.string().optional(),
  notes: z.string().optional()
});

export type CustomerInput = z.infer<typeof customerSchema>;
