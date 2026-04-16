// lib/schema/project.ts
import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1, "專案名稱必填"),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  pmId: z.string().optional(),
});


export const projectFormAdminSchema = z.object({
  title: z.string().min(1, "專案名稱為必填"),
  description: z.string().optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "ON_HOLD"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  pmId: z.string().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  
  // 👇 新增：建立報價單需要的欄位
  customerId: z.string().min(1, "請選擇客戶"),
  companyProfileId: z.string().min(1, "請選擇報價公司抬頭"),
  
  // 👇 新增：動態服務列表 (報價單明細)
  services: z.array(
    z.object({
      serviceId: z.string().min(1, "請選擇服務項目"),
      customName: z.string().optional(),
      quantity: z.number().min(1, "數量至少為 1"),
      unitPrice: z.number().min(0, "單價不能為負數"),
    })
  ),
});
export type ProjectFormValues = z.infer<typeof projectFormAdminSchema>;

// 解決型別衝突的關鍵：分別定義 Input 和 Output 型別
export type CreateProjectInput = z.input<typeof createProjectSchema>;   // 用於表單（允許 undefined）
export type CreateProjectOutput = z.output<typeof createProjectSchema>; // 用於後端提交（有 default 值）