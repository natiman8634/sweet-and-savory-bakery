import { z } from 'zod';

// Define validation rules for an Order
export const orderSchema = z.object({
  order_type: z.string().min(1, "Order type is required"),
  scheduled_for: z.string().datetime().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive("Quantity must be at least 1"),
  })).min(1, "Order must have at least one item"),
});