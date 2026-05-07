// src/lib/schemas/finance/invoiceSearchSchema.ts

import z from "zod";
import { PaymentType, PaymentMethod } from "@prisma/client";


export const paymentSearchSchema = z.object({
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

  // 付款類型（訂金 / 期中款 / 尾款 / 全額）
  paymentType: z.nativeEnum(PaymentType).optional(),

  // 付款方式
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),

  page: z.number().int().default(1),
  pageSize: z.number().int().default(20),
});