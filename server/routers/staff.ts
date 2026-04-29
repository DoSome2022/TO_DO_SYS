// server/routers/staff.ts
import { db } from "@/app/lib/prisma";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import z from "zod";

export const staffRouter = router({

  // ==========================================
  // ✅ 更新客戶資訊（Sales 專用，只能更新自己的客戶）
  // ==========================================
  updateCustomerInfo: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        name: z.string().optional().nullable(),
        customname: z.string().optional().nullable(),
        contactname: z.string().optional().nullable(),
        contactphone: z.string().optional().nullable(),
        companyname: z.string().optional().nullable(),
        companyaddress: z.string().optional().nullable(),
        companyemail: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any)?.role;
      // 1. 只有 SALES 或 ADMIN 可以修改
      if (userRole !== "SALES" && userRole !== "ADMIN") {
        throw new Error("無權限修改客戶資料");
      }
      // 2. 查詢客戶，確認該客戶確實隸屬於這位 Sales
      const customer = await db.customer.findUnique({
        where: { id: input.customerId },
        include: {
          quotations: {
            where: { salesId: userId },
            take: 1,
          },
        },
      });
      if (!customer) {
        throw new Error("找不到該客戶");
      }
      // 3. 如果是 SALES 角色，確保客戶至少有一張報價單是該 Sales 負責的
      if (userRole === "SALES") {
        // 方式 A：透過報價單關聯檢查
        if (customer.quotations.length === 0) {
          throw new Error("您沒有權限修改此客戶的資料");
        }
        // 方式 B（如果你的 Customer 有關聯 salesId 欄位，用這個更直接）
        // if (customer.salesId !== userId) {
        //   throw new Error("您沒有權限修改此客戶的資料");
        // }
      }
      // 4. 過濾掉 undefined 值，只保留有傳遞的欄位
      const updateData: Record<string, any> = {};
      for (const [key, value] of Object.entries(input)) {
        if (key !== "customerId" && value !== undefined) {
          updateData[key] = value;
        }
      }
      // 5. 執行更新
      const updatedCustomer = await db.customer.update({
        where: { id: input.customerId },
        data: updateData,
      });
      return updatedCustomer;
    }),


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