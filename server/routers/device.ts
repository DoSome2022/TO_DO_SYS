import { z } from "zod";
import { router, publicProcedure } from "../trpc"; // 假設你的 trpc 設定檔位置

import { TRPCError } from "@trpc/server";
import { db } from "@/app/lib/prisma";

export const deviceRouter = router({
  // 取得所有器材列表 (支援搜尋與篩選)
  devicelist: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      typeId: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const where: any = {};
      
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search } },
          { sku: { contains: input.search } },
        ];
      }
      if (input?.typeId) where.typeId = input.typeId;
      if (input?.status) where.status = input.status;

      return await db.device.findMany({
        where,
        include: { type: true }, // 包含類別名稱
        orderBy: { updatedAt: 'desc' },
      });
    }),

  // 取得單一器材詳情 (包含歷史紀錄)
  deviceById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const device = await db.device.findUnique({
        where: { id: input.id },
        include: {
          type: true,
          stockLogs: { orderBy: { createdAt: 'desc' }, take: 10 }, // 最近 10 筆庫存異動
          usages: { 
            where: { returnedAt: null }, // 只抓目前正在被誰借用
            include: { user: true, project: true } 
          },
          maintenances: { orderBy: { startDate: 'desc' }, take: 5 }, // 最近維修紀錄
        },
      });
      if (!device) throw new TRPCError({ code: "NOT_FOUND" });
      return device;
    }),

  // 建立新器材 (初始庫存通常為 0，透過進貨來增加)
  createdevice: publicProcedure
    .input(z.object({
      name: z.string(),
      sku: z.string().optional(),
      typeId: z.string().optional(),
      price: z.number().optional(),
      description: z.string().optional(),
      imgUrl: z.string().optional(),
      ownership: z.string().default("OWNED"),
    }))
    .mutation(async ({ input }) => {
      return await db.device.create({
        data: {
          name: input.name,
          sku: input.sku,
          typeId: input.typeId,
          price: input.price,
          description: input.description,
          imgUrl: input.imgUrl,
          ownership: input.ownership,
          quantity: 0, // 初始設為 0，建議建立後再呼叫 stockIn
        },
      });
    }),
    
    // 更新器材基本資訊
    updatedevice: publicProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        price: z.number().optional(),
        condition: z.string().optional(),
        imgUrl: z.string().optional(),
      }))
      .mutation(async({input}) => {
         const { id, ...data } = input;
         return await db.device.update({
             where: { id },
             data
         })
      }),

    // 取得所有分類 (給下拉選單用)
    getTypes: publicProcedure.query(async () => {
        return await db.deviceType.findMany();
    }),
});