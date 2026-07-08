// lib/schemas/quotation.ts

import z from "zod";

export const createQuotationSchema = z.object({
    title: z.string(),
    customerId: z.string(),
    customerPrice: z.number(),
});

export const updateQuotataionSchema = z.object({
    quotationId: z.string(),
  title: z.string().optional(),
  customerPrice: z.number().positive().optional(),
  status: z.enum(["DRAFT", "NEGOTIATING", "WON", "LOST"]).optional(),
})

export const updateQuotationStatusSchema = z.object({
  quotationId: z.string(),
  status: z.enum(["DRAFT", "NEGOTIATING", "WON", "LOST"]),
});


// ==========================================
// 🆕 報價明細管理 Schema（第一階段）
// ==========================================

// 新增項目到報價單
export const addItemSchema = z.object({
  quotationId: z.string(),
  serviceId: z.string().optional().nullable(),
  customName: z.string().min(1, '名稱為必填'),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0, '單價不能為負數'),
});

// 更新報價項目
export const updateItemSchema = z.object({
  itemId: z.string(),
  customName: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
});

// 刪除報價項目
export const removeItemSchema = z.object({
  itemId: z.string(),
  quotationId: z.string(),
});


// ==========================================
// 🆕 版本管理 Schema（第二階段）
// ==========================================

// 建立新版本
export const createVersionSchema = z.object({
  quotationId: z.string(),
  changeLog: z.string().optional(),
});

// 回滾到指定版本
export const revertToVersionSchema = z.object({
  quotationId: z.string(),
  targetVersionId: z.string(),
  changeLog: z.string().optional(),
});
