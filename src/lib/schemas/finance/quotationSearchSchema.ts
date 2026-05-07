// src/lib/schemas/finance/quotationSearchSchema.ts

import { QuoteStatus } from "@prisma/client";
import z from "zod";

// 搜索報價單的輸入 schema
export const quotationSearchSchema = z.object({
  // 日期範圍
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  day: z.number().int().min(1).max(31).optional(),

  // 金額範圍
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),

  // 文字搜索
  keyword: z.string().optional(),

  // 關聯搜尋
  projectCode: z.string().optional(),
  salesName: z.string().optional(),
  customerName: z.string().optional(),
  companyName: z.string().optional(),

  // 狀態
  status: z.nativeEnum(QuoteStatus).optional(),

  // 分頁
  page: z.number().int().default(1),
  pageSize: z.number().int().default(20),
});