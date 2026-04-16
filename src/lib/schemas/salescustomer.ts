import z from "zod";

export const sendMessageSchema = z.object({
  customerId: z.string(),
  content: z.string().min(1, "請輸入訊息內容"),
});

export const getConversationsSchema = z.object({
  customerId: z.string(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});