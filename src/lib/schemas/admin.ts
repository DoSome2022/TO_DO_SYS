// src/lib/schemas/admin.ts
import { z } from "zod";

export const adminFormSchema = z.object({
  name: z.string().min(3, "帳號名稱至少需要 3 個字"),
  email: z.string().email("請輸入有效的信箱").optional().or(z.literal("")),
  password: z.string().min(6, "密碼至少需要 6 個字"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "兩次輸入的密碼不一致",
  path: ["confirmPassword"], // 錯誤訊息會綁定在 confirmPassword 欄位上
});

export type AdminFormValues = z.infer<typeof adminFormSchema>;
