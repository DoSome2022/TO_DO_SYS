import z from "zod";

// ---------- Zod Schemas ----------
export const purchaseStatusEnum = z.enum([
  'DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 
  'PARTIAL', 'COMPLETED', 'CANCELLED'
]);
export const purchaseItemSchema = z.object({
  equipmentId: z.string().optional().nullable(),
  itemName: z.string().min(1, '品名為必填'),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  specification: z.string().optional().nullable(),
  quantity: z.number().int().min(1, '數量至少為1'),
  unitPrice: z.number().min(0, '單價不能為負數'),
  subtotal: z.number().min(0),
  receivedQty: z.number().int().min(0).default(0),
});
export const createPurchaseSchema = z.object({
  title: z.string().min(1, '採購標題為必填'),
  supplier: z.string().optional().nullable(),
  supplierContact: z.string().optional().nullable(),
  orderDate: z.date().default(() => new Date()),
  expectedDate: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: purchaseStatusEnum.default('DRAFT'),
  items: z.array(purchaseItemSchema).min(1, '至少需要一個採購項目'),
});

export const updatePurchaseSchema = createPurchaseSchema.partial().extend({
  id: z.string(),
});