import { z } from 'zod';

export const productServiceTypeSchema = z.enum(['PRODUCT', 'SERVICE']);

export const productServiceSchema = z.object({
  id: z.string().optional(),
  type: productServiceTypeSchema,
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  active: z.boolean().default(true)
});

export type ProductServiceInput = z.infer<typeof productServiceSchema>;
