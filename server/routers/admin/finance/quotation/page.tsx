//src/server/api/routers/admin/finance/quotation.ts


import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../../../trpc";
import { quotationSearchSchema } from "@/lib/schemas/finance/quotationSearchSchema";
import { InvoiceStatus ,QuoteStatus } from "@prisma/client";

// // 搜索報價單的輸入 schema
// const quotationSearchSchema = z.object({
//   // 日期範圍
//   year: z.number().int().optional(),
//   month: z.number().int().min(1).max(12).optional(),
//   day: z.number().int().min(1).max(31).optional(),

//   // 金額範圍
//   minAmount: z.number().optional(),
//   maxAmount: z.number().optional(),

//   // 文字搜索
//   keyword: z.string().optional(),

//   // 關聯搜尋
//   projectCode: z.string().optional(),
//   salesName: z.string().optional(),
//   customerName: z.string().optional(),
//   companyName: z.string().optional(),

//   // 狀態
//   status: z.string().optional(),

//   // 分頁
//   page: z.number().int().default(1),
//   pageSize: z.number().int().default(20),
// });

export const adminQuotationRouter = router({
  // 📋 搜索報價單列表（Admin 專用，可以看到完整價格）
  search: protectedProcedure
    .input(quotationSearchSchema)
    .query(async ({ ctx, input }) => {
      // 權限檢查：只有 Admin 可以看完整價格
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可查看" });
      }

      const { year, month, day, minAmount, maxAmount, keyword,
              projectCode, salesName, customerName, companyName,
              status, page, pageSize } = input;

      // 建立 WHERE 條件
      const where: Record<string, unknown> = {};

      // 日期過濾
      if (year || month || day) {
        const dateFilters: Record<string, unknown> = {};
        if (year) dateFilters.gte = new Date(year, 0, 1);
        if (year) dateFilters.lt = new Date(year + 1, 0, 1);
        if (year && month) {
          dateFilters.gte = new Date(year, month - 1, 1);
          dateFilters.lt = new Date(year, month, 1);
        }
        if (year && month && day) {
          dateFilters.gte = new Date(year, month - 1, day);
          dateFilters.lt = new Date(year, month - 1, day + 1);
        }
        where.createdAt = dateFilters;
      }

      // 金額過濾（用 customerPrice）
      if (minAmount !== undefined || maxAmount !== undefined) {
        const priceFilter: Record<string, unknown> = {};
        if (minAmount !== undefined) priceFilter.gte = minAmount;
        if (maxAmount !== undefined) priceFilter.lte = maxAmount;
        where.customerPrice = priceFilter;
      }

      // 關鍵字搜尋（title 或 ID）
      if (keyword) {
        where.OR = [
          { title: { contains: keyword } },
          { id: { contains: keyword } },
        ];
      }

      // projectCode 搜尋（透過關聯的 Project）
      if (projectCode) {
        where.project = { code: { contains: projectCode } };
      }

      // Sales 名稱搜尋
      if (salesName) {
        where.sales = { name: { contains: salesName } };
      }

      // 客戶名稱搜尋
      if (customerName) {
        where.customer = { name: { contains: customerName } };
      }

      // 公司名稱搜尋
      if (companyName) {
        where.companyProfile = { name: { contains: companyName } };
      }

      // 狀態過濾
      if (status) {
        where.status = status;
      }

      const [items, total] = await Promise.all([
        ctx.db.quotation.findMany({
          where,
          include: {
            customer: { select: { id: true, name: true, companyname: true } },
            sales: { select: { id: true, name: true } },
            companyProfile: { select: { id: true, name: true } },
            project: { select: { id: true, code: true, title: true } },
            items: {
              include: { service: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.quotation.count({ where }),
      ]);

      // 👇 加上這一段轉換
      const mappedItems = items.map((item) => ({
        ...item,
        customerPrice: item.customerPrice?.toNumber() ?? null,
        totalAmount: item.totalAmount.toNumber(),
      }));

      return {
        items: mappedItems,  // ← 改用 mappedItems
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };

    }),

  // 📄 單筆報價單詳細（含完整價格）
// 在 quotation router 中
getById: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const quotation = await ctx.db.quotation.findUnique({
      where: { id: input.id },
      include: {
        project: true,
        customer: true,
        companyProfile: true,
        sales: { select: { id: true, name: true } },
        items: true,
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        // ⚠️ 修正 1：Prisma 關聯名稱是 Invoice（大寫 I），不是 invoices
        Invoice: {
          select: { id: true, invoiceNo: true, status: true, totalAmount: true },
        },
        // ⚠️ 修正 2：Quotation 沒有 createdBy，移除或先註解掉
        // createdBy: { select: { id: true, name: true } },
      },
    });

    if (!quotation) throw new TRPCError({ code: "NOT_FOUND" });

    return {
      ...quotation,
      totalAmount: quotation.totalAmount.toNumber(),
      items: quotation.items.map(item => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        subtotal: item.subtotal.toNumber(),
      })),
      // ⚠️ 修正 3：將 Invoice 映射為 invoices（小寫 i），讓前端可以讀 quotation.invoices
      invoices: quotation.Invoice.map(inv => ({
        ...inv,
        totalAmount: inv.totalAmount.toNumber(),
      })),
    };
  }),



  // 📊 統計摘要（給 Admin 儀表板用）
  summary: protectedProcedure
    .input(z.object({ year: z.number().int().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const year = input?.year ?? new Date().getFullYear();
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year + 1, 0, 1);

      const [totalQuotations, wonQuotations, totalRevenue] = await Promise.all([
        ctx.db.quotation.count({
          where: { createdAt: { gte: yearStart, lt: yearEnd } },
        }),
        ctx.db.quotation.count({
          where: {
            status: "WON",
            createdAt: { gte: yearStart, lt: yearEnd },
          },
        }),
        ctx.db.quotation.aggregate({
          _sum: { customerPrice: true },
          where: {
            status: "WON",
            createdAt: { gte: yearStart, lt: yearEnd },
          },
        }),
      ]);

      return {
        totalQuotations,
        wonQuotations,
        winRate: totalQuotations > 0 ? (wonQuotations / totalQuotations) * 100 : 0,
        totalRevenue: totalRevenue._sum.customerPrice ?? 0,
        year,
      };
    }),

// src/server/api/routers/finance/quotation.ts
updateTotalAmount: protectedProcedure
  .input(z.object({
    id: z.string(),
    totalAmount: z.number(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return ctx.db.quotation.update({
      where: { id: input.id },
      data: { totalAmount: input.totalAmount },
    });
  }),
// 從報價單建立收據
createFromQuotation: protectedProcedure
  .input(
    z.object({
      quotationId: z.string(),
      invoiceDate: z.date(),
      dueDate: z.date(),
      items: z.array(
        z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          customerPrice: z.number(),
        })
      ),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    // 1. 取得原報價單
    const quotation = await ctx.db.quotation.findUnique({
      where: { id: input.quotationId },
      include: { project: true, customer: true },
    });
    if (!quotation) throw new TRPCError({ code: "NOT_FOUND", message: "報價單不存在" });

    // 2. 計算總金額
    const totalAmount = input.items.reduce((sum, item) => sum + item.customerPrice, 0);

    // 3. 產生收據編號（可自訂規則）
    const invoiceNo = `INV-${Date.now()}`;

    // 4. 建立收據
    const invoice = await ctx.db.invoice.create({
      data: {
        invoiceNo,
        quotationId: input.quotationId,
        projectId: quotation.projectId,
        customerId: quotation.customerId,
        companyProfileId: quotation.companyProfileId,
        issuedDate: input.invoiceDate,
        dueDate: input.dueDate,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        status: InvoiceStatus.UNPAID,
        createdById: ctx.session.user.id,
      },
    });

    // 5. 更新報價單狀態為「已轉收據」
    await ctx.db.quotation.update({
      where: { id: input.quotationId },
      data: { status: "CONVERTED" as QuoteStatus },

    });

    return { id: invoice.id, invoiceNo: invoice.invoiceNo };
  }),
// ==========================================
// 編輯報價單（完整更新）
// ==========================================
update: protectedProcedure
  .input(z.object({
    id: z.string(),
    title: z.string().optional(),
    note: z.string().optional().nullable(),
    validUntil: z.date().optional().nullable(),
    status: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const { id, ...data } = input;
    return ctx.db.quotation.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.validUntil !== undefined && { validUntil: data.validUntil }),
        ...(data.status !== undefined && { status: data.status as QuoteStatus }),
      },
    });
  }),

// ==========================================
// 更新單一報價明細項目
// ==========================================
updateItem: protectedProcedure
  .input(z.object({
    id: z.string(),           // item.id
    name: z.string().optional(),
    quantity: z.number().optional(),
    unitPrice: z.number().optional(),
    // description: z.string().optional().nullable(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const { id, ...data } = input;
    
    // 更新項目
    const updatedItem = await ctx.db.quotationItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { customName: data.name }), 
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
        // ...(data.description !== undefined && { description: data.description }),
      },
    });

    // 自動重新計算 subtotal
    const unitPrice = data.unitPrice ?? updatedItem.unitPrice.toNumber();
    const quantity = data.quantity ?? updatedItem.quantity;
    const newSubtotal = unitPrice * quantity;

    await ctx.db.quotationItem.update({
      where: { id },
      data: { subtotal: newSubtotal },
    });

    // 重新計算整份報價單總額
    const quotationId = updatedItem.quotationId;
    const allItems = await ctx.db.quotationItem.findMany({
      where: { quotationId },
    });
    const totalAmount = allItems.reduce((sum, item) => sum + item.subtotal.toNumber(), 0);

    await ctx.db.quotation.update({
      where: { id: quotationId },
      data: { totalAmount },
    });

    return { success: true };
  }),

// ==========================================
// 新增報價明細項目
// ==========================================
addItem: protectedProcedure
  .input(z.object({
    quotationId: z.string(),
    name: z.string(),
    quantity: z.number().default(1),
    unitPrice: z.number().default(0),
    // description: z.string().optional().nullable(),
    serviceId: z.string().optional(),  // ✅ 改為可選

  }))
  .mutation(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const subtotal = input.quantity * input.unitPrice;

    const item = await ctx.db.quotationItem.create({
      data: {
        quotationId: input.quotationId,
        ...(input.serviceId && { serviceId: input.serviceId }), // ✅ 有傳才帶入
        customName: input.name,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        subtotal,
      },
    });


    // 重新計算總額
    const allItems = await ctx.db.quotationItem.findMany({
      where: { quotationId: input.quotationId },
    });
    const totalAmount = allItems.reduce((sum, item) => sum + item.subtotal.toNumber(), 0);

    await ctx.db.quotation.update({
      where: { id: input.quotationId },
      data: { totalAmount },
    });

    return item;
  }),

// ==========================================
// 刪除報價明細項目
// ==========================================
removeItem: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const item = await ctx.db.quotationItem.findUnique({
      where: { id: input.id },
    });
    if (!item) throw new TRPCError({ code: "NOT_FOUND" });

    await ctx.db.quotationItem.delete({ where: { id: input.id } });

    // 重新計算總額
    const allItems = await ctx.db.quotationItem.findMany({
      where: { quotationId: item.quotationId },
    });
    const totalAmount = allItems.reduce((sum, item) => sum + item.subtotal.toNumber(), 0);

    await ctx.db.quotation.update({
      where: { id: item.quotationId },
      data: { totalAmount },
    });

    return { success: true };
  }),


});
