// src/server/api/routers/service.ts
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const serviceRouter = router({
  // 取得所有服務列表 (Admin 後台管理用)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.service.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  // 取得「已啟用」的服務 (建立報價單時，下拉選單只該顯示啟用的)
  getActive: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.service.findMany({
      where: { isActive: true },
      orderBy: { type: "asc" }, // 依照類型排序，前端分群會比較好做
    });
  }),

  // 建立新服務
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "服務名稱為必填"),
        type: z.string().min(1, "請選擇或輸入服務類型"),
        price: z.number().min(0, "價錢不能為負數"), // 前端傳 number，Prisma 會自動轉為 Decimal
        description: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.service.create({
        data: input,
      });
    }),

  // 更新服務
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        type: z.string().optional(),
        price: z.number().min(0).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.service.update({
        where: { id },
        data,
      });
    }),

  // 刪除服務 (實務上更建議只更新 isActive 為 false，即「軟刪除」，以免影響過去報價單的歷史紀錄)
  toggleActive: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.service.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),
    
  // 真實刪除 (若該服務從未被使用過)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.service.delete({
        where: { id: input.id },
      });
    }),
});
