// server/routers/admin/finance/invoice/page.tsx

import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../../../trpc";
import { invoiceSearchSchema } from "@/lib/schemas/finance/invoiceSearchSchema";



export const adminInvoiceRouter = router({
  // 📋 搜索收據列表
  search: protectedProcedure
    .input(invoiceSearchSchema)
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { year, month, day, minAmount, maxAmount, keyword,
              projectCode, salesName, customerName, companyName,
              status, hasBalance, page, pageSize } = input;

      const where: Record<string, unknown> = {};

      // 日期過濾（用 issuedDate）
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
        where.issuedDate = dateFilters;
      }

      // 金額過濾（用 totalAmount）
      if (minAmount !== undefined || maxAmount !== undefined) {
        const amountFilter: Record<string, unknown> = {};
        if (minAmount !== undefined) amountFilter.gte = minAmount;
        if (maxAmount !== undefined) amountFilter.lte = maxAmount;
        where.totalAmount = amountFilter;
      }

      // 有關鍵字時多欄位搜尋
      if (keyword) {
        where.OR = [
          { invoiceNo: { contains: keyword } },
          { notes: { contains: keyword } },
        ];
      }

      // 關聯搜尋
      if (projectCode) {
        where.project = { code: { contains: projectCode } };
      }
      if (customerName) {
        where.customer = { name: { contains: customerName } };
      }
      if (companyName) {
        where.companyProfile = { name: { contains: companyName } };
      }
      if (status) {
        where.status = status;
      }
      // 有未付餘額（尾款）
      if (hasBalance === true) {
        where.balanceAmount = { gt: 0 };
      }

const [items, total] = await Promise.all([
  ctx.db.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, companyname: true } },
      companyProfile: { select: { id: true, name: true } },
      project: { select: { id: true, code: true, title: true } },
      quotation: {
        select: {
          id: true,
          title: true,
          sales: { select: { name: true } },
          items: {
            select: { subtotal: true },
          },
        },
      },
      createdBy: { select: { id: true, name: true } },
      payments: {
        orderBy: { paidAt: "desc" },
        select: {
          id: true,
          amount: true,
          type: true,
          method: true,
          paidAt: true,
        },
      },
    },
    orderBy: { issuedDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  }),
  ctx.db.invoice.count({ where }),
]);

return {
  items: items.map((item) => {
    // ✅ 從 quotation items 加總 subtotal 得到原始報價總金額（對照用）
    const quotationTotal = (item.quotation?.items ?? []).reduce(
      (sum, qi) => sum + Number(qi.subtotal), 0
    );
    // ✅ 從 payments 加總得到已收金額
    const paid = item.payments.reduce(
      (sum, p) => sum + Number(p.amount), 0
    );
    
    // 🔥 修正：判斷是否為尾款收據
    const isTailInvoice = item.invoiceNo?.startsWith("INV-TAIL");
    
    // 🔥 修正：尾款收據使用資料庫中的 totalAmount，不是從報價單計算
    const totalAmount = isTailInvoice
      ? Number(item.totalAmount)  // 使用資料庫儲存的值（$9,050）
      : quotationTotal;           // 一般收據從報價單計算（$12,050）

    return {
      ...item,
      totalAmount,
      paidAmount: paid,
      balanceAmount: totalAmount - paid,
      payments: item.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    };
  }),
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize),
};

  }),


  // 📄 單筆收據詳細
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          companyProfile: true,
          project: true,
          quotation: {                 // ← 關鍵：include quotation
            include: {
              items: true,             // 前端可能需要 items
              sales: true,             // 如果需要 sales name
            },
          },
          createdBy: true,
          payments: {
            include: { receivedBy: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '發票不存在' });
      }
      // 轉換 payments
const mappedPayments = invoice.payments.map((p) => ({
  id: p.id,
  amount: Number(p.amount),
  paymentType: p.type,
  paymentMethod: p.method,
  receivedBy: p.receivedBy ? { id: p.receivedBy.id, name: p.receivedBy.name } : null,
  receivedAt: p.paidAt,      // ← 修正這裡
  note: p.note,
  createdAt: p.createdAt,
}));
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNo,
        invoiceNo: invoice.invoiceNo,            // 保留原始
        status: invoice.status,
        totalAmount: Number(invoice.totalAmount), // Decimal → number
        paidAmount: Number(invoice.paidAmount),
        balance: Number(invoice.balanceAmount),   // ← 關鍵：balanceAmount → balance
        balanceAmount: Number(invoice.balanceAmount), // 可選保留
        issuedAt: invoice.issuedDate,             // issuedDate → issuedAt
        dueDate: invoice.dueDate,
        notes: invoice.notes ?? '',
        note: invoice.notes ?? '',
        projectCode: invoice.project?.code ?? '',
        projectName: invoice.project?.title ?? '',
        customerName: invoice.customer?.name ?? '',
        companyName: invoice.companyProfile?.name ?? null,
        salesName: invoice.quotation?.sales?.name ?? null,
        quotationNumber: invoice.quotation?.number ?? '',
        quotationId: invoice.quotationId,
        // ↓↓↓ 重點：將 quotation 物件回傳 ↓↓↓
        quotation: invoice.quotation
          ? {
              id: invoice.quotation.id,
              quotationNumber: invoice.quotation.number ?? '',
              status: invoice.quotation.status,
              // 若前端還需要其他欄位，再加
            }
          : null,
        // items 從 quotation.items 取得
        items: invoice.quotation?.items.map((item) => ({
          id: item.id,
          name: item.customName,           // ✅ customName
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          amount: Number(item.subtotal),   // ✅ subtotal
        })) ?? [],

        payments: mappedPayments,
        createdBy: {
          id: invoice.createdBy.id,
          name: invoice.createdBy.name,
        },
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      } as const;
    }),



  // 📊 收據統計
  summary: protectedProcedure
    .input(z.object({ year: z.number().int().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const year = input?.year ?? new Date().getFullYear();
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year + 1, 0, 1);

      const [totalInvoices, totalPaid, totalUnpaid, partialCount] = await Promise.all([
        ctx.db.invoice.count({
          where: { issuedDate: { gte: yearStart, lt: yearEnd } },
        }),
        ctx.db.invoice.aggregate({
          _sum: { paidAmount: true },
          where: { issuedDate: { gte: yearStart, lt: yearEnd } },
        }),
        ctx.db.invoice.aggregate({
          _sum: { balanceAmount: true },
          where: {
            issuedDate: { gte: yearStart, lt: yearEnd },
            status: { not: "PAID" },
          },
        }),
        ctx.db.invoice.count({
          where: {
            issuedDate: { gte: yearStart, lt: yearEnd },
            status: "PARTIAL",
          },
        }),
      ]);

return {
  totalInvoices,
  totalRevenue: totalPaid._sum.paidAmount?.toNumber() ?? 0,
  outstandingBalance: totalUnpaid._sum.balanceAmount?.toNumber() ?? 0,
  partialPaymentCount: partialCount,
  year,
};

    }),

// ── 編輯收據基本資訊 ──
  // update: protectedProcedure
  //   .input(
  //     z.object({
  //       id: z.string(),
  //       invoiceNumber: z.string().optional(),
  //       projectName: z.string().optional(),
  //       customerName: z.string().optional(),
  //       companyName: z.string().optional(),
  //       issuedAt: z.date().optional(),
  //       dueDate: z.date().optional(),
  //       salesName: z.string().optional(),
  //       notes: z.string().optional(),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     if (ctx.session.user.role !== "ADMIN") {
  //       throw new TRPCError({ code: "FORBIDDEN" });
  //     }
  //     const { id, ...updateData } = input;
  //     const invoice = await ctx.db.invoice.update({
  //       where: { id },
  //       data: updateData,
  //     });
  //     return { id: invoice.id };
  //   }),

update: protectedProcedure
  .input(z.object({
    id: z.string(),
    notes: z.string().optional(),
    dueDate: z.date().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    const result = await ctx.db.invoice.update({
      where: { id },
      data,
    });
    // ✅ 回傳純 JSON 物件，避免 Decimal 序列化問題
    return {
      id: result.id,
      invoiceNo: result.invoiceNo,
      status: result.status,
      notes: result.notes,
      dueDate: result.dueDate,
      updatedAt: result.updatedAt,
    }
  }),
createTailInvoice: protectedProcedure
  .input(z.object({ invoiceId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { invoiceId } = input;

    // 1. 查詢原 invoice（含關聯資料）
    const originalInvoice = await ctx.db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        quotation: {
          include: {
            items: true,       // items 從 quotation 來
            sales: true,       // salesName 從這來
          },
        },
        customer: true,
        project: true,
        companyProfile: true,
        payments: true,        // Payment 沒有 status 欄位，全部取出
        createdBy: true,
      },
    });
    if (!originalInvoice) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '收據不存在' });
    }

    // 2. 計算總應收（從 quotation.items 的 subtotal 加總）
    const totalAmount = originalInvoice.quotation?.items.reduce(
      (sum, item) => sum + Number(item.subtotal), 0
    ) ?? 0;

    // 3. 計算已收（從 payments 加總 amount）
    const paidAmount = originalInvoice.payments.reduce(
      (sum, p) => sum + Number(p.amount), 0
    );
    const remaining = totalAmount - paidAmount;

    if (remaining <= 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '此收據已全額付清，無需產生尾款收據',
      });
    }

    // 4. 產生新的 invoiceNo（簡易版，你可替換成自己的邏輯）
    const count = await ctx.db.invoice.count();
    const newInvoiceNo = `INV-TAIL-${String(count + 1).padStart(6, '0')}`;

    // 5. 建立尾款收據
    const tailInvoice = await ctx.db.invoice.create({
      data: {
        invoiceNo: newInvoiceNo,
        customerId: originalInvoice.customerId,
        projectId: originalInvoice.projectId,
        quotationId: originalInvoice.quotationId,
        companyProfileId: originalInvoice.companyProfileId,
        createdById: originalInvoice.createdById,
        issuedDate: new Date(),
        dueDate: originalInvoice.dueDate,
        status: 'PARTIAL',              // 使用現有合法狀態
        totalAmount: remaining,
        paidAmount: 0,
        balanceAmount: remaining,
        notes: `尾款收據（原收據：${originalInvoice.invoiceNo}）`,
        // type 和 hasTailInvoice 需要 schema 支援才加
      },
    });

    // 6. 標記原收據（可選 — 若 schema 無 hasTailInvoice 欄位就先跳過）
    // await ctx.db.invoice.update({
    //   where: { id: invoiceId },
    //   data: { hasTailInvoice: true },
    // });

    return {
      id: tailInvoice.id,
      invoiceNo: tailInvoice.invoiceNo,
      status: tailInvoice.status,
      totalAmount: Number(tailInvoice.totalAmount),
    };
  }),



});