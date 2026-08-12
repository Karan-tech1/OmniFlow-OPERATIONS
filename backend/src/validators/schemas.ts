import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']).default('SALES'),
});

export const customerSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().regex(/^\+?[0-9]{10,15}$/),
  email: z.string().email().optional().or(z.literal('')),
  businessName: z.string().min(2),
  gstNumber: z.string().max(20).optional().or(z.literal('')),
  type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  address: z.string().min(5),
  notes: z.string().max(1000).optional(),
  nextFollowUpAt: z.string().datetime().optional().nullable(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2).max(40),
  imageUrl: z.string().optional().nullable(),
  unitPrice: z.coerce.number().positive(),
  currentStock: z.coerce.number().int().min(0),
  minimumStock: z.coerce.number().int().min(0),
  categoryId: z.string().uuid(),
  warehouseId: z.string().uuid(),
});

export const movementSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  type: z.enum(['IN', 'OUT']),
  reason: z.string().min(3).max(250),
});

export const challanSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
  })).min(1),
});

export const paymentSchema = z.object({
  amountPaid: z.coerce.number().positive(),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER']),
});
