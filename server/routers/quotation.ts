import { z } from "zod";
import { TRPCError } from "@trpc/server";
// import { protectedProcedure, router, salesProcedure } from "../router";
import { createQuotationSchema, updateQuotationStatusSchema , updateQuotataionSchema, addItemSchema, updateItemSchema, removeItemSchema } from "@/lib/schemas/quotation";
import { protectedProcedure, publicProcedure, router, salesProcedure } from "../trpc";
import { db } from "@/app/lib/prisma";
import { updateQuotationTotal } from "@/lib/quotation.service";




export const quotationRouter = router({
  // ==========================================
  // 核心 CRUD 功能 (新增)
  // ==========================================

  // 取得所有報價單 (根據權限過濾)
  getQuotations: protectedProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "NEGOTIATING", "WON", "LOST"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        include: { position: true },
      });

      const isCustomer = !user;
      const isAdmin = user?.position?.name?.toLowerCase().includes("admin") || 
                      user?.role === "ADMIN";

      // 建立過濾條件
      const where: any = {};

      if (isCustomer) {
        // 客戶只能看自己的報價單
        where.customerId = userId;
      } else if (!isAdmin) {
        // 一般員工只能看自己負責的報價單
        where.salesId = userId;
      }
      // Admin 可以看全部

      if (input?.status) {
        where.status = input.status;
      }

      const quotations = await ctx.db.quotation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              companyname: true,
              contactname: true,
            },
          },
          sales: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          _count: {
            select: {
              internalMessages: true,
              externalMessages: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit || 20,
        skip: input?.cursor ? 1 : 0,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined = undefined;
      if (quotations.length === (input?.limit || 20)) {
        nextCursor = quotations[quotations.length - 1].id;
      }

      return {
        quotations,
        nextCursor,
      };
    }),

  // 取得單一報價單詳情
  getQuotationById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const user = await ctx.db.user.findUnique({ where: { id: userId } });
      const isCustomer = !user;
      const isAdmin = user?.role === "ADMIN";

      const quotation = await ctx.db.quotation.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          sales: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          project: true,
        items: {  // 👈 加上這個
          include: {
            service: true,
          },
        },
          internalMessages: {
            include: {
              sender: {
                select: { id: true, name: true, role: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          externalMessages: {
            include: {
              senderUser: {
                select: { id: true, name: true, role: true },
              },
              senderCustomer: {
                select: { id: true, name: true, companyname: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!quotation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "報價單不存在" });
      }

      // 權限檢查
      if (isCustomer && quotation.customerId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "無權查看此報價單" });
      }

      if (!isCustomer && !isAdmin && quotation.salesId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "只能查看自己負責的報價單" });
      }

      return quotation;
    }),

  // 建立報價單 (Sales 專用)
  createQuotation: salesProcedure
    .input(createQuotationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const quotation = await ctx.db.quotation.create({
          data: {
            title: input.title,
            customerPrice: input.customerPrice,
            status: "DRAFT",
            salesId: ctx.session.user.id!,
            customerId: input.customerId,
          },
          include: {
            customer: true,
            sales: true,
          },
        });

        return { success: true, quotation };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "建立失敗",
        });
      }
    }),

  // 更新報價單
  updateQuotation: salesProcedure
    .input(updateQuotataionSchema)
    .mutation(async ({ ctx, input }) => {
      const { quotationId, ...data } = input;

      // 檢查報價單是否存在且屬於該 Sales
      const existing = await ctx.db.quotation.findFirst({
        where: { id: quotationId, salesId: ctx.session.user.id! },
      });
     if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "報價單不存在或無權限修改" });
      }

      const quotation = await ctx.db.quotation.update({
        where: { id: quotationId },
        data,
        include: {
          customer: true,
          project: true,
        },
      });

      return { success: true, quotation };
    }),

  // 更新報價單狀態
  updateQuotationStatus: salesProcedure
    .input(updateQuotationStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { quotationId, status } = input;

      const existing = await ctx.db.quotation.findFirst({
        where: { id: quotationId, salesId: ctx.session.user.id! },
        include: { project: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "報價單不存在或無權限修改" });
      }

      // 如果狀態改為 WON，可以選擇自動建立專案
      let projectId = existing.projectId;
      if (status === "WON" && !existing.projectId) {
        // 可選：自動建立關聯專案
        const project = await ctx.db.project.create({
          data: {
            title: existing.title,
            customerPrice: existing.customerPrice,
            status: "IN_PROGRESS",
            salesId: ctx.session.user.id!,
            customerId: existing.customerId,
            quotationId: existing.id,
          },
        });
        projectId = project.id;
      }

      const quotation = await ctx.db.quotation.update({
        where: { id: quotationId },
        data: { 
          status,
          projectId: projectId || undefined,
        },
        include: {
          customer: true,
          project: true,
        },
      });

      return { success: true, quotation };
    }),

  // 刪除報價單 (草稿狀態才能刪除)
  deleteQuotation: salesProcedure
    .input(z.object({ quotationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.quotation.findFirst({
        where: { 
          id: input.quotationId, 
          salesId: ctx.session.user.id!,
          status: "DRAFT",
        },
      });

      if (!existing) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "只能刪除自己建立的草稿報價單" 
        });
      }

      await ctx.db.quotation.delete({
        where: { id: input.quotationId },
      });

      return { success: true };
    }),

  // 取得 Sales 的統計數據
  getSalesStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id!;
      const user = await ctx.db.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw new TRPCError({ code: "FORBIDDEN", message: "只有員工能查看統計" });
      }

      const [
        quotationsCount,
        wonQuotationsCount,
        totalQuotationValue,
        projectsCount,
        activeProjectsCount,
        customersCount,
      ] = await Promise.all([
        ctx.db.quotation.count({
          where: { salesId: userId, status: { not: "DRAFT" } },
        }),
        ctx.db.quotation.count({
          where: { salesId: userId, status: "WON" },
        }),
        ctx.db.quotation.aggregate({
          where: { salesId: userId, status: "WON" },
          _sum: { customerPrice: true },
        }),
        ctx.db.project.count({
          where: { salesId: userId },
        }),
        ctx.db.project.count({
          where: { salesId: userId, status: { not: "COMPLETED" } },
        }),
        ctx.db.customer.count({
          where: {
            quotations: {
              some: { salesId: userId },
            },
          },
        }),
      ]);

    // ✅ 將 Decimal 轉換為 number
    const rawTotal = totalQuotationValue._sum.customerPrice;
    const convertedTotal = rawTotal ? Number(rawTotal) : 0;

      return {
        quotationsCount,
        wonQuotationsCount,
        totalQuotationValue: convertedTotal,
        projectsCount,
        activeProjectsCount,
        customersCount,
        winRate: quotationsCount > 0 
          ? (wonQuotationsCount / quotationsCount) * 100 
          : 0,
      };
    }),


// 取得 Sales 的報價單列表
getSalesQuotations: protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    const user = await ctx.db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new TRPCError({ code: "FORBIDDEN", message: "只有員工能查看" });
    }

    const quotations = await ctx.db.quotation.findMany({
      where: { salesId: userId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            companyname: true,
            contactname: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            internalMessages: true,
            externalMessages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // ✅ 轉換 Decimal 為 number
    return quotations.map((q) => ({
      ...q,
      customerPrice: q.customerPrice ? Number(q.customerPrice) : null,
    }));
  }),

  // 取得 Sales 的專案列表
getSalesProjects: protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    const user = await ctx.db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new TRPCError({ code: "FORBIDDEN", message: "只有員工能查看" });
    }

    const projects = await ctx.db.project.findMany({
      where: { salesId: userId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            companyname: true,
          },
        },
        pm: {
          select: {
            id: true,
            name: true,
          },
        },
        phases: {
          select: {
            id: true,
            name: true,        // ← 加上階段名稱
            status: true,
            order: true,       // ← 排序用
            selectedVersions: {  // ← 加上階段的版本
              select: {
                id: true,
                versionName: true,
                contentUrl: true,
                note: true,
                createdAt: true,
                userId: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { order: "asc" }, // ← 按順序排列
        },
        workItems: {
          where: { isCompleted: false },
          select: { id: true },
        },

      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    // ✅ 轉換 Decimal 為 number，並計算完成度
    return projects.map((project) => {
      const totalPhases = project.phases.length;
      const completedPhases = project.phases.filter(
        (p) => p.status === "COMPLETED"
      ).length;
      const progress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;
      const pendingWorkItems = project.workItems.length;


      // ✅ 轉換版本的 totalAmount（Decimal → number）



      return {
        ...project,
        customerPrice: project.customerPrice ? Number(project.customerPrice) : null,
        progress,
        pendingWorkItems,

      };
    });
  }),
// 取得 Sales 的客戶列表
getSalesCustomers: protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    const user = await ctx.db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new TRPCError({ code: "FORBIDDEN", message: "只有員工能查看" });
    }

    const customers = await ctx.db.customer.findMany({
      where: {
        quotations: {
          some: { salesId: userId },
        },
      },
      include: {
        quotations: {
          where: { salesId: userId },
          select: {
            id: true,
            title: true,           // ← 🔴 加上這行
            status: true,
            customerPrice: true,
            createdAt: true,
            projectId: true,       // ← 🔴 加上這行
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            quotations: {
              where: { salesId: userId },
            },
            Project: {
              where: { salesId: userId },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    // ✅ 轉換 quotations 中的 Decimal 為 number
    return customers.map((customer) => ({
      ...customer,
      quotations: customer.quotations.map((q) => ({
        ...q,
        customerPrice: q.customerPrice ? Number(q.customerPrice) : null,
      })),
    }));
  }),
  // 取得可選擇的客戶（用於建立報價單）
  getAvailableCustomers: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id!;
      const user = await ctx.db.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new TRPCError({ code: "FORBIDDEN", message: "只有員工能查看" });
      }

      // 顯示該 Sales 曾經報價過的客戶
      const customers = await ctx.db.customer.findMany({
        where: {
          quotations: {
            some: { salesId: userId },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return customers;
    }),

  // ==========================================
  // 2. 內部對話 (保留您原有的)
  // ==========================================

  getInternalMessages: protectedProcedure
    .input(z.object({ quotationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const user = await ctx.db.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw new TRPCError({ code: "FORBIDDEN", message: "客戶無法讀取內部對話" });
      }

      return ctx.db.internalQuoteMessage.findMany({
        where: { quotationId: input.quotationId },
        include: { sender: { select: { name: true, role: true } } }, 
        orderBy: { createdAt: "asc" },
      });
    }),

  sendInternalMessage: protectedProcedure
    .input(z.object({ 
      quotationId: z.string(), 
      content: z.string().min(1) 
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const user = await ctx.db.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new TRPCError({ code: "FORBIDDEN", message: "客戶無法發送內部對話" });
      }

      return ctx.db.internalQuoteMessage.create({
        data: {
          quotationId: input.quotationId,
          content: input.content,
          senderId: userId,
        },
      });
    }),

  // ==========================================
  // 3. 外部對話 (保留您原有的)
  // ==========================================

  getExternalMessages: protectedProcedure
    .input(z.object({ quotationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const user = await ctx.db.user.findUnique({ where: { id: userId } });
      const isCustomer = !user;
      
      if (isCustomer) {
        const quote = await ctx.db.quotation.findUnique({ where: { id: input.quotationId } });
        if (quote?.customerId !== userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "無權查看別人的報價單" });
        }
      }

      return ctx.db.externalQuoteMessage.findMany({
        where: { quotationId: input.quotationId },
        include: {
          senderUser: { select: { name: true, role: true } },     
          senderCustomer: { select: { name: true } },             
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  sendExternalMessage: protectedProcedure
    .input(z.object({ 
      quotationId: z.string(), 
      content: z.string().min(1) 
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const user = await ctx.db.user.findUnique({ where: { id: userId } });
      const isCustomer = !user; 

      return ctx.db.externalQuoteMessage.create({
        data: {
          quotationId: input.quotationId,
          content: input.content,
          senderCustomerId: isCustomer ? userId : null,
          senderUserId: !isCustomer ? userId : null,
        },
      });
    }),



    
  // 獲取報價單詳細資料
  getQuotationDetail: publicProcedure
    .input(z.object({
      quotationId: z.string(),
      projectId: z.string(),
    }))
    .query(async ({ input }) => {
      const quotation = await db.quotation.findFirst({
        where: {
          id: input.quotationId,
          projectId: input.projectId,
        },
        include: {
          companyProfile: true,
          items: {
            include: {
              service: true,
            },
          },
        },
      });

      if (!quotation) {
        throw new Error("報價單不存在");
      }

      // 獲取所有版本（這裡假設您有版本表，如果沒有需要先建立）
      const versions = await db.quotationVersion.findMany({
        where: { quotationId: quotation.id },
        orderBy: { versionNumber: 'desc' },
      });

      return {
        ...quotation,
        versions: versions.length > 0 ? versions : [{
          id: quotation.id,
          versionNumber: 1,
          title: quotation.title,
          status: quotation.status,
          totalAmount: quotation.totalAmount,
          createdAt: quotation.createdAt,
          isLatest: true,
          notes: null,
        }],
        currentVersionId: versions.find(v => v.isLatest)?.id || quotation.id,
      };
    }),

  // 切換報價單版本
  switchQuotationVersion: publicProcedure
    .input(z.object({
      quotationId: z.string(),
      versionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // 更新當前版本
      await db.quotation.update({
        where: { id: input.quotationId },
        data: {
          // 根據 versionId 更新對應的報價單內容
        },
      });

      return { success: true, versionNumber: 1 };
    }),
// 建立新版本
  createQuotationVersion: publicProcedure
    .input(z.object({
      quotationId: z.string(),
      notes: z.string().optional(),
      changeLog: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 獲取當前報價單
      const currentQuotation = await db.quotation.findUnique({
        where: { id: input.quotationId },
        include: {
          items: {
            include: { service: true },
          },
        },
      });

      if (!currentQuotation) {
        throw new Error("報價單不存在");
      }

      // 獲取最大版本號
      const maxVersion = await db.quotationVersion.aggregate({
        where: { quotationId: input.quotationId },
        _max: { versionNumber: true },
      });

      const newVersionNumber = (maxVersion._max.versionNumber || 0) + 1;

      // 將舊版本標記為非最新
      await db.quotationVersion.updateMany({
        where: { 
          quotationId: input.quotationId,
          isLatest: true,
        },
        data: { isLatest: false },
      });

      // 建立新版本
      const newVersion = await db.quotationVersion.create({
        data: {
          versionNumber: newVersionNumber,
          title: currentQuotation.title,
          status: currentQuotation.status,
          baseCost: currentQuotation.baseCost,
          agreedCost: currentQuotation.agreedCost,
          customerPrice: currentQuotation.customerPrice,
          pmBudget: currentQuotation.pmBudget,
          totalAmount: currentQuotation.totalAmount,
          notes: input.notes,
          changeLog: input.changeLog,
          isLatest: true,
          quotationId: input.quotationId,
          snapshot: {
            title: currentQuotation.title,
            items: currentQuotation.items,
            totalAmount: currentQuotation.totalAmount,
            customerPrice: currentQuotation.customerPrice,
          },
        },
      });

      // 更新報價單的當前版本
      await db.quotation.update({
        where: { id: input.quotationId },
        data: { currentVersionId: newVersion.id },
      });

      return newVersion;
    }),

// 🆕 新增項目到報價單
addItem: salesProcedure
  .input(addItemSchema)
  .mutation(async ({ ctx, input }) => {
    const { quotationId, ...itemData } = input;
    const subtotal = itemData.quantity * itemData.unitPrice;

    const item = await ctx.db.quotationItem.create({
      data: {
        quotationId,
        serviceId: itemData.serviceId,
        customName: itemData.customName,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
        subtotal,
      },
    });

    // ✅ 只傳一個參數
    await updateQuotationTotal(quotationId);

    return { success: true, item };
  }),

// 🆕 更新報價項目
updateItem: salesProcedure
  .input(updateItemSchema)
  .mutation(async ({ ctx, input }) => {
    const { itemId, ...data } = input;

    const existing = await ctx.db.quotationItem.findUnique({
      where: { id: itemId },
      include: { quotation: true },
    });

    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '項目不存在' });
    }

    const quantity = data.quantity ?? existing.quantity;
    const unitPrice = data.unitPrice ?? Number(existing.unitPrice);
    const subtotal = quantity * unitPrice;

    const item = await ctx.db.quotationItem.update({
      where: { id: itemId },
      data: { ...data, subtotal },
    });

    // ✅ 只傳一個參數
    await updateQuotationTotal(existing.quotationId);

    return { success: true, item };
  }),

// 🆕 刪除報價項目
removeItem: salesProcedure
  .input(removeItemSchema)
  .mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.quotationItem.findUnique({
      where: { id: input.itemId },
    });

    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '項目不存在' });
    }

    await ctx.db.quotationItem.delete({
      where: { id: input.itemId },
    });

    // ✅ 只傳一個參數
    await updateQuotationTotal(input.quotationId);

    return { success: true };
  }),


});