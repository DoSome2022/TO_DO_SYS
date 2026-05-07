import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../../../trpc";
import { paymentSearchSchema } from "@/lib/schemas/finance/paymentSearchSchema";
import { InvoiceStatus } from "@/app/admin/finance/types";
// 假設 Prisma client 在 @prisma/client
import { PaymentMethod, PaymentType } from "@prisma/client";


// const paymentSearchSchema = z.object({
//   year: z.number().int().optional(),
//   month: z.number().int().min(1).max(12).optional(),
//   day: z.number().int().min(1).max(31).optional(),

//   minAmount: z.number().optional(),
//   maxAmount: z.number().optional(),

//   keyword: z.string().optional(),

//   projectCode: z.string().optional(),
//   salesName: z.string().optional(),
//   customerName: z.string().optional(),
//   companyName: z.string().optional(),

//   // 付款類型（訂金 / 期中款 / 尾款 / 全額）
//   paymentType: z.nativeEnum(PaymentType).optional(),

//   // 付款方式
//   paymentMethod: z.nativeEnum(PaymentMethod).optional(),

//   page: z.number().int().default(1),
//   pageSize: z.number().int().default(20),
// });

export const adminPaymentRouter = router({
  // 📋 搜索付款紀錄（尾款收據頁面用）
  search: protectedProcedure
    .input(paymentSearchSchema)
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { year, month, day, minAmount, maxAmount, keyword,
              projectCode, salesName, customerName, companyName,
              paymentType, paymentMethod, page, pageSize } = input;

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
        where.paidAt = dateFilters;
      }

      // 金額過濾
      if (minAmount !== undefined || maxAmount !== undefined) {
        const amountFilter: Record<string, unknown> = {};
        if (minAmount !== undefined) amountFilter.gte = minAmount;
        if (maxAmount !== undefined) amountFilter.lte = maxAmount;
        where.amount = amountFilter;
      }

      // 付款類型 / 方式
      if (paymentType) where.type = paymentType;
      if (paymentMethod) where.method = paymentMethod;

      // 透過 invoice 做關聯搜尋
      const invoiceWhere: Record<string, unknown> = {};
      if (keyword) {
        invoiceWhere.OR = [
          { invoiceNo: { contains: keyword } },
        ];
      }
      if (projectCode) invoiceWhere.project = { code: { contains: projectCode } };
      if (customerName) invoiceWhere.customer = { name: { contains: customerName } };
      if (companyName) invoiceWhere.companyProfile = { name: { contains: companyName } };

      if (Object.keys(invoiceWhere).length > 0) {
        where.invoice = invoiceWhere;
      }

      const [items, total] = await Promise.all([
        ctx.db.payment.findMany({
          where,
          include: {
            invoice: {
              include: {
                customer: { select: { id: true, name: true, companyname: true } },
                project: { select: { id: true, code: true, title: true } },
                companyProfile: { select: { id: true, name: true } },
              },
            },
            receivedBy: { select: { id: true, name: true } },
          },
          orderBy: { paidAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.payment.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  // 📊 收款統計（給 Admin 看這個月收了多少钱）
  monthlySummary: protectedProcedure
    .input(
      z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { year, month } = input;
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 1);

      const [totalPayments, byType, byMethod] = await Promise.all([
        ctx.db.payment.aggregate({
          _sum: { amount: true },
          _count: true,
          where: {
            paidAt: { gte: monthStart, lt: monthEnd },
          },
        }),
        ctx.db.payment.groupBy({
          by: ["type"],
          _sum: { amount: true },
          _count: true,
          where: {
            paidAt: { gte: monthStart, lt: monthEnd },
          },
        }),
        ctx.db.payment.groupBy({
          by: ["method"],
          _sum: { amount: true },
          _count: true,
          where: {
            paidAt: { gte: monthStart, lt: monthEnd },
          },
        }),
      ]);

      return {
        totalAmount: totalPayments._sum.amount ?? 0,
        totalCount: totalPayments._count,
        byType,
        byMethod,
        year,
        month,
      };
    }),
    // router 端（僅供參考，如果已存在則跳過）
getById: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const payment = await ctx.db.payment.findUnique({
      where: { id: input.id },
      include: {
        invoice: {
          include: {
            project: true,
            // ⚠️ 新增：Include payments，讓前端可以取同一收據的其他付款
            payments: {
              select: {
                id: true,
                amount: true,
                type: true,
                paidAt: true,
              },
              orderBy: { paidAt: "desc" },
            },
          },
        },
      },
    });

    if (!payment) throw new TRPCError({ code: "NOT_FOUND" });

    // ⚠️ 轉換 Decimal → number
    return {
      ...payment,
      amount: payment.amount.toNumber(),
      invoice: payment.invoice
        ? {
            ...payment.invoice,
            totalAmount: payment.invoice.totalAmount.toNumber(),
            paidAmount: payment.invoice.paidAmount.toNumber(),
            balanceAmount: payment.invoice.balanceAmount.toNumber(),
            payments: payment.invoice.payments.map((p) => ({
              ...p,
              amount: p.amount.toNumber(),
            })),
          }
        : null,
    };
  }),

// 新增收款紀錄
create: protectedProcedure
  .input(
    z.object({
      invoiceId: z.string(),
      amount: z.number(),
      // ✅ 改用 z.nativeEnum()，型別與 Prisma 完全對齊
      method: z.nativeEnum(PaymentMethod),
      type: z.nativeEnum(PaymentType),
      referenceNumber: z.string().optional(),
      paidAt: z.date(),
      note: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    // 1. 建立付款紀錄
    const payment = await ctx.db.payment.create({
      data: {
        invoiceId: input.invoiceId,
        amount: input.amount,
        method: input.method,
        type: input.type,
        reference: input.referenceNumber,  // ← 改成 reference
        paidAt: input.paidAt,
        note: input.note,
        receivedById: ctx.session.user.id,
      },
    });

    // 2. 更新 invoice 的 paidAmount / balanceAmount / status
    const invoice = await ctx.db.invoice.findUnique({
      where: { id: input.invoiceId },
      select: { totalAmount: true, paidAmount: true },
    });
    if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

    const currentPaid = invoice.paidAmount.toNumber();
    const totalAmount = invoice.totalAmount.toNumber();
    const newPaid = currentPaid + input.amount;
    const newBalance = totalAmount - newPaid;

    let newStatus: InvoiceStatus;
    if (newBalance <= 0) {
      newStatus = "PAID" as InvoiceStatus;       // 或 InvoiceStatus.PAID
    } else if (newPaid > 0) {
      newStatus = "PARTIAL" as InvoiceStatus;    // 或 InvoiceStatus.PARTIAL
    } else {
      newStatus = "SENT" as InvoiceStatus;       // 或 InvoiceStatus.SENT
    }
    await ctx.db.invoice.update({
      where: { id: input.invoiceId },
      data: {
        paidAmount: newPaid,
        balanceAmount: Math.max(0, newBalance),
        status: newStatus,   // ✅ 型別正確
      },
    });

    return { id: payment.id };
  }),

});
