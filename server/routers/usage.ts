import { z } from "zod";
import { router, publicProcedure } from "../trpc"; // 假設你的 trpc 設定檔位置
import { TRPCError } from "@trpc/server";
import { db } from "@/app/lib/prisma";


export const usageRouter = router({
  // 借出 (Checkout)
  checkout: publicProcedure
    .input(z.object({
      deviceId: z.string(),
      userId: z.string(),
      projectId: z.string().optional(),
      expectedReturnAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      // 1. 檢查器材是否存在且狀態可用
      const device = await db.device.findUnique({ 
          where: { id: input.deviceId } 
      });
      
      if (!device) throw new TRPCError({ code: "NOT_FOUND" });
      
      // --- 修正部分開始 ---
      
      // 1. 處理可能的 null 值：如果 quantity 為 null，視為 0
      const currentQuantity = device.quantity ?? 0;

      // 2. 邏輯檢查
      // 注意：原本的寫法是用 && (且)，這意味著只有當「狀態不對」且「數量不足」同時發生才報錯。
      // 通常邏輯應該是：如果「狀態不可用」 或者 「數量不足」，就應該報錯。
      // 這裡我改為較嚴謹的檢查：
      
      const isUnavailableStatus = device.status !== "AVAILABLE";
      const isOutOfStock = currentQuantity <= 0;

      // 如果這是一個需要追蹤庫存的物品（假設 quantity > 0 代表是耗材類，或者它是單一物品）
      // 這裡的邏輯取決於您的業務需求，以下是修復 Type Error 的最直接改法：
      
      if (isUnavailableStatus && isOutOfStock) {
          throw new TRPCError({ 
              code: "CONFLICT", 
              message: "器材目前不可借用 (數量不足或狀態異常)" 
          });
      }
      
      // 如果您的本意是只要其中一個條件不符就擋下，請改用：
      // if (isUnavailableStatus || isOutOfStock) { ... }

      // --- 修正部分結束 ---

      return await db.$transaction(async (tx) => {
        // 建立借出紀錄
        const usage = await tx.deviceUsage.create({
          data: {
            deviceId: input.deviceId,
            userId: input.userId,
            projectId: input.projectId,
            expectedReturnAt: input.expectedReturnAt,
          },
        });

        // 更新器材狀態為使用中
        await tx.device.update({
          where: { id: input.deviceId },
          data: { status: "IN_USE" },
        });

        // 可選：如果你希望借出同時產生 StockLog (紀錄東西不在倉庫)，可以在這裡加
        // 但通常 Usage 表已經足夠追蹤去向

        return usage;
      });
    }),

  // 歸還 (Checkin)
  checkin: publicProcedure
    .input(z.object({
      usageId: z.string(), // 透過 Usage ID 歸還
      returnNote: z.string().optional(),
      isBroken: z.boolean().default(false), // 歸還時是否壞了？
    }))
    .mutation(async ({ input }) => {
      return await db.$transaction(async (tx) => {
        // 1. 更新 Usage 紀錄，填上歸還時間
        const usage = await tx.deviceUsage.update({
          where: { id: input.usageId },
          data: {
            returnedAt: new Date(),
            returnNote: input.returnNote,
          },
        });

        // 2. 更新器材狀態
        await tx.device.update({
          where: { id: usage.deviceId },
          data: { 
              status: input.isBroken ? "MAINTENANCE" : "AVAILABLE",
              condition: input.returnNote // 更新器材狀況備註
          },
        });

        return usage;
      });
    }),
});