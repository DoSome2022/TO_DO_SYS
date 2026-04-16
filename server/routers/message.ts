// src/server/routers/message.ts (假設的 tRPC router 位置)
import { z } from "zod";
import { publicProcedure, router } from "../trpc"; // 替換為你的 trpc 定義檔
import { db } from "@/app/lib/prisma";

export const messageRouter = router({
  // 1. 發送一般客服諮詢 (SalesCustomerConversation)
  // 1. 發送一般客服諮詢 (SalesCustomerConversation)
  sendGeneralMessage: publicProcedure
    .input(
      z.object({
        content: z.string().min(1),
        customerId: z.string(),
        salesId: z.string().optional(), 
      })
    )
    .mutation(async ({ input }) => {
      let targetSalesId = input.salesId;

      // 如果前端沒有傳入指定的業務，我們必須「智能尋找」該客戶的負責業務
      if (!targetSalesId) {
        
        // 策略 1：找看看以前有沒有對話紀錄，抓最近一次對話的業務
        const lastConversation = await db.salesCustomerConversation.findFirst({
          where: { customerId: input.customerId },
          orderBy: { createdAt: "desc" },
        });

        if (lastConversation) {
          targetSalesId = lastConversation.salesId;
        } else {
          // 策略 2：如果沒有對話過，找看看有沒有為這個客戶開過報價單的業務
          const lastQuotation = await db.quotation.findFirst({
            where: { customerId: input.customerId },
            orderBy: { createdAt: "desc" },
          });

          if (lastQuotation) {
            targetSalesId = lastQuotation.salesId;
          } else {
            // 策略 3：如果真的是完全沒接觸過的全新客戶，才派發給 ADMIN (總管理員)
            const defaultAdmin = await db.user.findFirst({ where: { role: "ADMIN" } });
            targetSalesId = defaultAdmin?.id || "";
          }
        }
      }

      return db.salesCustomerConversation.create({
        data: {
          content: input.content,
          senderType: "CUSTOMER", // 客戶發送
          customerId: input.customerId,
          salesId: targetSalesId, // ✅ 現在會正確綁定給專屬的 Sales 了！
        },
      });
    }),


  // 2. 發送專案/報價單專屬對話 (ExternalQuoteMessage)
  sendProjectMessage: publicProcedure
    .input(
      z.object({
        content: z.string().min(1),
        quotationId: z.string(),
        customerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return db.externalQuoteMessage.create({
        data: {
          content: input.content,
          quotationId: input.quotationId,
          senderCustomerId: input.customerId, // 記錄是哪個客人發送的
        },
      });
    }),
});
