// server/routers/deliverable.ts
import { db } from "@/app/lib/prisma";
import { publicProcedure, router } from "../trpc";
import z from "zod";
import { ossClient } from "@/lib/oss";

export const DeliverableRouter = router({
    // 1. 新增交付成品
    // ★ 1. 新增這個：讓前端來要 OSS 的上傳簽名
    getOssUploadSignature: publicProcedure
        .input(z.object({
            fileName: z.string(), // 前端想上傳的檔名
        }))
        .mutation(async ({ input }) => {
            // 產生一個唯一性的檔名，避免覆蓋
            const uniqueKey = `deliverables/${Date.now()}-${input.fileName}`;
            
            // 產生一個有時效性的直傳 URL (假設 10 分鐘內有效)
            const signatureUrl = ossClient.signatureUrl(uniqueKey, {
                expires: 600, // 600秒 = 10分鐘
                method: 'PUT',
            });

            return {
                uploadUrl: signatureUrl, // 前端拿到這個網址就可以直接 PUT 檔案上去
                fileKey: uniqueKey,      // 告訴前端檔案路徑是什麼，等下存 DB 會用到
                publicUrl: `https://${process.env.ALI_OSS_BUCKET}.${process.env.ALI_OSS_REGION}.aliyuncs.com/${uniqueKey}` // 預計的公開網址
            };
        }),

    // 2. 獲取該階段的所有交付成品
    getDeliverablesByPhaseId: publicProcedure
        .input(z.object({
            phaseId: z.string(),
        }))
        .query(async ({ input }) => {
            return await db.deliverable.findMany({
                where: {
                    phaseId: input.phaseId,
                },
                orderBy: {
                    createdAt: 'desc', 
                }
            });
        }),

    // 3. 刪除交付成品
    deleteDeliverable: publicProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ input }) => {
            // 先找出這個成品，確認它是不是 OSS 文件
            const deliverable = await db.deliverable.findUnique({
                where: { id: input.id }
            });

            if (!deliverable) throw new Error("找不到該成品");

            // ★ 貼心提醒：如果它是 OSS 檔案，且有 fileKey，您可以在這裡呼叫阿里雲 OSS SDK 刪除雲端檔案
            // if (deliverable.type === "FILE" && deliverable.fileKey) {
            //     await ossClient.delete(deliverable.fileKey);
            // }

            // 刪除資料庫紀錄
            return await db.deliverable.delete({
                where: { id: input.id },
            });
        }),
        // ★ 補上這支：上傳 OSS 成功後，呼叫這個把資料存進資料庫
    createDeliverable: publicProcedure
        .input(z.object({
            phaseId: z.string(),
            name: z.string(),
            url: z.string(),
            fileKey: z.string().optional(), // 加上 fileKey，方便未來刪除 OSS 檔案
            fileSize: z.number().optional(), // 加上 fileSize
        }))
        .mutation(async ({ input }) => {
            return await db.deliverable.create({
                data: {
                    phaseId: input.phaseId,
                    name: input.name,
                    url: input.url,
                    fileKey: input.fileKey,
                    fileSize: input.fileSize,
                }
            });
        }),

        // 獲取交付成品的對話記錄
  getDeliverableMessages: publicProcedure
    .input(z.object({ deliverableId: z.string() }))
    .query(async ({ input }) => {
      const messages = await db.deliverableMessage.findMany({  // 注意：大寫 D
        where: { deliverableId: input.deliverableId },
        include: {
          user: {
            select: { id: true, name: true, role: true }
          },
          customer: {
            select: { id: true, name: true, companyname: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      return messages;
    }),

  // 發送交付成品的對話
  sendDeliverableMessage: publicProcedure
    .input(z.object({
      deliverableId: z.string(),
      content: z.string().min(1),
      senderType: z.enum(['customer', 'sales', 'admin']),
      senderId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const isCustomer = input.senderType === 'customer';
      
      const message = await db.deliverableMessage.create({  // 注意：大寫 D
        data: {
          deliverableId: input.deliverableId,
          content: input.content,
          senderType: input.senderType,
          senderId: input.senderId,
          ...(isCustomer 
            ? { customerId: input.senderId }
            : { userId: input.senderId }
          ),
        },
        include: {
          user: {
            select: { id: true, name: true, role: true }
          },
          customer: {
            select: { id: true, name: true, companyname: true }
          }
        }
      });
      
      return message;
    }),
});
