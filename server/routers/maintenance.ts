import { z } from "zod";
import { router, publicProcedure } from "../trpc"; // 假設你的 trpc 設定檔位置

import { TRPCError } from "@trpc/server";
import { db } from "@/app/lib/prisma";


export const maintenanceRouter = router({
  // 開始維修
  start: publicProcedure
    .input(z.object({
      deviceId: z.string(),
      reason: z.string(),
      vendor: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.$transaction(async (tx) => {
        // 建立維修紀錄
        const log = await tx.maintenanceLog.create({
          data: {
            deviceId: input.deviceId,
            reason: input.reason,
            vendor: input.vendor,
            startDate: new Date(),
          },
        });

        // 更新狀態
        await tx.device.update({
          where: { id: input.deviceId },
          data: { status: "MAINTENANCE" },
        });

        return log;
      });
    }),

  // 完成維修
  finish: publicProcedure
    .input(z.object({
      maintenanceId: z.string(),
      cost: z.number(),
      resultStatus: z.enum(["AVAILABLE", "BROKEN"]), // 修好了還是修不好報廢？
    }))
    .mutation(async ({ input }) => {
       return await db.$transaction(async (tx) => {
        // 更新維修紀錄
        const log = await tx.maintenanceLog.update({
           where: { id: input.maintenanceId },
           data: {
               endDate: new Date(),
               cost: input.cost
           }
        });

        // 更新器材狀態
        await tx.device.update({
            where: { id: log.deviceId },
            data: { status: input.resultStatus }
        });

        return log;
       });
    }),
});