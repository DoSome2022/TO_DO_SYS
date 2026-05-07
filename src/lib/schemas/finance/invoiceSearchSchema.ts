// src/lib/schemas/finance/invoiceSearchSchema.ts

import { InvoiceStatus } from "@prisma/client";
import z from "zod";

export const invoiceSearchSchema = z.object({
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  day: z.number().int().min(1).max(31).optional(),

  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),

  keyword: z.string().optional(),

  projectCode: z.string().optional(),
  salesName: z.string().optional(),
  customerName: z.string().optional(),
  companyName: z.string().optional(),

  // 收據狀態過濾
  status: z.nativeEnum(InvoiceStatus).optional(),

  // 付款類型過濾（只顯示有尾款的）
  hasBalance: z.boolean().optional(),

  page: z.number().int().default(1),
  pageSize: z.number().int().default(20),
});
