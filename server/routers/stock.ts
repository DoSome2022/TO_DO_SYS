import { z } from "zod";
import { router, publicProcedure } from "../trpc"; // 假設你的 trpc 設定檔位置

import { db } from "@/app/lib/prisma";

export const stockRouter = router({
  // 調整庫存 (進貨、報廢、盤點)
  // ★ 重要：使用 Transaction 確保 StockLog 與 Device.quantity 一致
  adjust: publicProcedure
    .input(z.object({
      deviceId: z.string(),
      changeAmount: z.number(), // 正數增加，負數減少
      reason: z.string(), // "PURCHASE", "BROKEN", "ADJUSTMENT"
      note: z.string().optional(),
      operatorId: z.string().optional(), // 這裡應該從 Context 拿 current user
    }))
    .mutation(async ({ input }) => {
      const { deviceId, changeAmount, reason, note, operatorId } = input;

      return await db.$transaction(async (tx) => {
        // 1. 建立 Log
        const log = await tx.stockLog.create({
          data: {
            deviceId,
            changeAmount,
            reason,
            note,
            operatorId,
          },
        });

        // 2. 更新主表數量
        // 如果是報廢 (BROKEN)，除了扣總庫存，還要增加壞掉的計數
        const updateData: any = {
          quantity: { increment: changeAmount },
        };
        
        if (reason === "BROKEN" && changeAmount < 0) {
           // 庫存變少，但壞掉的記數變多 (注意 changeAmount 是負的)
           updateData.brokenQuantity = { increment: Math.abs(changeAmount) };
           // 如果全壞了，可能要改狀態
           // updateData.status = "BROKEN"; // 視業務邏輯決定是否自動改狀態
        }

        const updatedDevice = await tx.device.update({
          where: { id: deviceId },
          data: updateData,
        });

        return { log, updatedDevice };
      });
    }),
});