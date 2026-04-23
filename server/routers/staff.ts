// server/routers/staff.ts
import { db } from "@/app/lib/prisma";
import { publicProcedure, router } from "../trpc";
import z from "zod";

export const staffRouter = router({
  // 獲取客戶詳細資料
  getCustomerDetail: publicProcedure
    .input(z.object({
      customerId: z.string(),
      staffId: z.string(),
    }))
    .query(async ({ input }) => {
      const customer = await db.customer.findFirst({
        where: {
          id: input.customerId,
          // 權限檢查：確保該客戶屬於這個 staff
          OR: [
            { quotations: { some: { salesId: input.staffId } } },
            { Project: { some: { salesId: input.staffId } } },
          ],
        },
      });

      if (!customer) {
        throw new Error("客戶不存在或無權限訪問");
      }

      return customer;
    }),

  // 獲取客戶的專案列表
  getCustomerProjects: publicProcedure
    .input(z.object({
      customerId: z.string(),
      staffId: z.string(),
    }))
    .query(async ({ input }) => {
      const projects = await db.project.findMany({
        where: {
          customerId: input.customerId,
          salesId: input.staffId, // 只顯示該 staff 負責的專案
        },
        orderBy: { createdAt: 'desc' },
      });

      return projects;
    }),

  // 獲取客戶的報價單列表
  getCustomerQuotations: publicProcedure
    .input(z.object({
      customerId: z.string(),
      staffId: z.string(),
    }))
    .query(async ({ input }) => {
      const quotations = await db.quotation.findMany({
        where: {
          customerId: input.customerId,
          salesId: input.staffId,
        },
        orderBy: { createdAt: 'desc' },
      });

      return quotations;
    }),
});