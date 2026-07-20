import { z } from 'zod';

export const orderSchema = z.object({
  order_type: z.string().min(1, "Order type is required"),
  scheduled_for: z.string().datetime().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive("Quantity must be at least 1"),
  })).min(1, "Order must have at least one item"),
});

export const profileSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  default_address: z.string().min(5).optional(),
});