import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getConversationsSchema, sendMessageSchema } from "@/lib/schemas/salescustomer";
import { router, salesProcedure } from "../trpc";

// 客戶列表的回傳型別
export type CustomerWithStats = {
  id: string;
  name: string | null;
  companyname: string | null;
  contactname: string | null;
  contactphone: string | null;
  companyemail: string | null;
  totalQuotations: number;
  wonQuotations: number;
  totalProjects: number;
  activeProjects: number;
  lastConversationAt: Date | null;
  lastConversationPreview: string | null;
  unreadCount: number;
  currentSalesId: string | null;
  currentSalesName: string | null;
};

export const salesCustomerRouter = router({
  // ==========================================
  // 取得 Sales 的所有客戶列表（含統計）
  // ==========================================
  getCustomersWithStats: salesProcedure
    .query(async ({ ctx }): Promise<CustomerWithStats[]> => {
      const salesId = ctx.user.id;

      // 1. 【修改點】：只要有派發過對話 或 有報價單，就算作該 Sales 的客戶 (資料隔離的核心)
      const customers = await ctx.db.customer.findMany({
        where: {
          OR: [
            { quotations: { some: { salesId } } },
            { SalesCustomerConversation: { some: { salesId } } }
          ]
        },
        include: {
          quotations: {
            where: { salesId },
            select: {
              id: true,
              status: true,
              customerPrice: true,
              createdAt: true,
            },
          },
          Project: { 
            where: { salesId },
            select: {
              id: true,
              status: true,
              title: true,
              salesId: true,
              sales: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          SalesCustomerConversation: {  
            where: { salesId },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              content: true,
              createdAt: true,
              isRead: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      // 2. 計算未讀訊息數量與統計數據
      const customersWithUnreadCount = await Promise.all(
        customers.map(async (customer) => {
          const unreadCount = await ctx.db.salesCustomerConversation.count({
            where: {
              customerId: customer.id,
              salesId,
              isRead: false,
            },
          });

          // 計算報價單統計
          const quotations = customer.quotations;
          const wonQuotations = quotations.filter((q) => q.status === "WON");
          
          // 計算專案統計
          const projects = customer.Project;
          const activeProjects = projects.filter(
            (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED"
          );
          
          // 找出目前跟進的 Sales
          const activeProject = activeProjects[0];
          const currentSales = activeProject?.sales || null;
          
          // 最後一則對話
          const lastConversation = customer.SalesCustomerConversation[0];
          
          return {
            id: customer.id,
            name: customer.name,
            companyname: customer.companyname,
            contactname: customer.contactname,
            contactphone: customer.contactphone,
            companyemail: customer.companyemail,
            totalQuotations: quotations.length,
            wonQuotations: wonQuotations.length,
            totalProjects: projects.length,
            activeProjects: activeProjects.length,
            lastConversationAt: lastConversation?.createdAt || null,
            lastConversationPreview: lastConversation?.content 
              ? lastConversation.content.substring(0, 50) + (lastConversation.content.length > 50 ? "..." : "")
              : null,
            unreadCount,
            currentSalesId: currentSales?.id || null,
            currentSalesName: currentSales?.name || null,
          };
        })
      );

      return customersWithUnreadCount;
    }),

  // ==========================================
  // 取得與特定客戶的對話記錄
  // ==========================================
  getConversations: salesProcedure
    .input(getConversationsSchema)
    .query(async ({ ctx, input }) => {
      const { customerId, cursor, limit } = input;
      const salesId = ctx.user.id;

      // 【修改點】：確認該客戶是否真的屬於這位 Sales
      const isMyCustomer = await ctx.db.customer.findFirst({
        where: {
          id: customerId,
          OR: [
            { quotations: { some: { salesId } } },
            { SalesCustomerConversation: { some: { salesId } } }
          ]
        },
      });

      if (!isMyCustomer) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "您沒有權限查看此客戶的對話 (資料隔離限制)",
        });
      }

      // 取得對話記錄
      const conversations = await ctx.db.salesCustomerConversation.findMany({
        where: {
          customerId,
          salesId,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderType: true,
          // ✨ 補上這三個，符合 Conversation 的要求
          salesId: true,
          customerId: true,
          isRead: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
      });

      // 標記為已讀
      await ctx.db.salesCustomerConversation.updateMany({
        where: {
          customerId,
          salesId,
          isRead: false,
        },
        data: { isRead: true },
      });

      let nextCursor: string | undefined = undefined;
      if (conversations.length === limit) {
        nextCursor = conversations[conversations.length - 1].id;
      }

      return {
        conversations: conversations.reverse(),
        nextCursor,
      };
    }),

  // ==========================================
  // 發送訊息給客戶
  // ==========================================
  sendMessage: salesProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const { customerId, content } = input;
      const salesId = ctx.user.id;

      // 【修改點】：防護機制，發送訊息前再次確認是否為專屬客戶
      const isMyCustomer = await ctx.db.customer.findFirst({
        where: {
          id: customerId,
          OR: [
            { quotations: { some: { salesId } } },
            { SalesCustomerConversation: { some: { salesId } } }
          ]
        },
      });

      if (!isMyCustomer) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "您沒有權限發送訊息給此客戶 (資料隔離限制)",
        });
      }

      const message = await ctx.db.salesCustomerConversation.create({
        data: {
          content,
          salesId,
          customerId,
          senderType: "SALES", // ✨ 關鍵修改：告訴資料庫這是業務發送的！
        },
      });
      return message;
    }),

  // ==========================================
  // 取得未讀訊息數量
  // ==========================================
  getUnreadCount: salesProcedure
    .query(async ({ ctx }) => {
      const salesId = ctx.user.id;

      const count = await ctx.db.salesCustomerConversation.count({
        where: {
          salesId,
          isRead: false,
        },
      });

      return { count };
    }),

  // ==========================================
  // 取得客戶基本資訊
  // ==========================================
  getCustomerInfo: salesProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { customerId } = input;
      const salesId = ctx.user.id;

      // 【修改點】：只撈取自己負責的客戶基本資訊
      const customer = await ctx.db.customer.findFirst({
        where: {
          id: customerId,
          OR: [
            { quotations: { some: { salesId } } },
            { SalesCustomerConversation: { some: { salesId } } }
          ]
        },
        include: {
          quotations: {
            where: { salesId },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          Project: {
            where: { salesId },
            include: {
              pm: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "找不到該客戶，或者該客戶不屬於您負責",
        });
      }

      return customer;
    }),
});
