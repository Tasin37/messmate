import { z } from 'zod';

export const createMessSchema = z.object({
  name: z.string().min(2, 'Mess name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and dashes'),
  currencyCode: z.string().length(3).default('BDT'),
  timezone: z.string().default('Asia/Dhaka'),
  address: z.string().max(255).optional(),
});

export const createInviteSchema = z.object({
  messId: z.string().uuid(),
  roleToAssign: z.enum(['manager', 'member']).default('member'),
  expiresInDays: z.number().int().min(1).max(30).default(7),
  maxUses: z.number().int().min(1).max(100).default(1),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  displayName: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  roomLabel: z.string().max(50).optional(),
});

export const updateMemberSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  roomLabel: z.string().max(50).optional(),
  role: z.enum(['manager', 'member']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export const mealEntrySchema = z.object({
  messId: z.string().uuid(),
  memberId: z.string().uuid(),
  mealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  mealSlotId: z.string().uuid(),
  quantity: z.number().min(0).max(10).default(1.0),
  entryType: z.enum(['self', 'guest', 'manager_adjustment']).default('self'),
  hostMemberId: z.string().uuid().optional(),
  note: z.string().max(255).optional(),
});

export const expenseEntrySchema = z.object({
  messId: z.string().uuid(),
  periodId: z.string().uuid().optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paidByMemberId: z.string().uuid(),
  categoryId: z.string().uuid(),
  title: z.string().min(2).max(200),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal string'),
  note: z.string().max(500).optional(),
});

export const sharedBillSchema = z.object({
  messId: z.string().uuid(),
  periodId: z.string().uuid(),
  title: z.string().min(2).max(150),
  category: z.string().min(2).max(50),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  allocationMethod: z.enum(['equal', 'weighted', 'custom', 'room_based']).default('equal'),
  allocations: z
    .array(
      z.object({
        memberId: z.string().uuid(),
        amount: z.string().optional(),
        weight: z.number().optional(),
      })
    )
    .optional(),
});

export const paymentSchema = z.object({
  messId: z.string().uuid(),
  memberId: z.string().uuid(),
  periodId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  method: z.enum(['cash', 'bkash', 'nagad', 'bank', 'other']).default('cash'),
  reference: z.string().max(100).optional(),
  note: z.string().max(255).optional(),
  idempotencyKey: z.string().max(100).optional(),
});
