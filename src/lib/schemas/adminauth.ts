// src/lib/schemas/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  name: z.string().min(1, "請輸入帳號名稱"),
  password: z.string().min(1, "請輸入密碼"),
});

export type LoginValues = z.infer<typeof loginSchema>;
