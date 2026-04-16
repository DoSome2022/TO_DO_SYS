// src/lib/schemas/company.ts
import { z } from "zod";

export const companyProfileSchema = z.object({
  name: z.string().min(1, "公司名稱為必填"),
  // logoUrl 允許空白字串或有效的網址
  logoUrl: z.string().url("必須是有效的網址").optional().or(z.literal("")),
  address: z.string().optional(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
});
