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