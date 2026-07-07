// server/api/routers/purchase.ts

import { z } from 'zod';

import { TRPCError } from '@trpc/server';
import { createPurchaseSchema, purchaseStatusEnum, updatePurchaseSchema } from '@/lib/schemas/purchase';
import { protectedProcedure, router } from '../trpc';


// ---------- Router ----------
export const purchaseRouter = router({

  // 📌 列表（支援篩選）
  list: protectedProcedure
    .input(
      z.object({
        status: purchaseStatusEnum.optional(),
        supplier: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        search: z.string().optional(), // 搜尋標題/單號
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.status) where.status = input.status;
      if (input.supplier) where.supplier = { contains: input.supplier };
      if (input.dateFrom || input.dateTo) {
        where.orderDate = {};
        if (input.dateFrom) where.orderDate.gte = input.dateFrom;
        if (input.dateTo) where.orderDate.lte = input.dateTo;
      }
      if (input.search) {
        where.OR = [
          { title: { contains: input.search } },
          { purchaseNo: { contains: input.search } },
        ];
      }

      const [data, total] = await Promise.all([
        ctx.db.purchase.findMany({
          where,
          include: {
            items: {
              include: { equipment: true },
            },
            createdBy: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { orderDate: 'desc' },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.db.purchase.count({ where }),
      ]);

      return {
        data,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  // 📌 單筆查詢
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const purchase = await ctx.db.purchase.findUnique({
        where: { id: input.id },
        include: {
          items: {
            include: { equipment: true },
          },
          createdBy: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      if (!purchase) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '採購單不存在' });
      }

      return purchase;
    }),

  // 📌 新增
  create: protectedProcedure
    .input(createPurchaseSchema)
    .mutation(async ({ ctx, input }) => {
      // 自動生成採購單號：PO-2026-0001
      const year = new Date().getFullYear();
      const lastOrder = await ctx.db.purchase.findFirst({
        where: { purchaseNo: { startsWith: `PO-${year}` } },
        orderBy: { purchaseNo: 'desc' },
        select: { purchaseNo: true },
      });

      let nextSeq = 1;
      if (lastOrder) {
        const lastNum = parseInt(lastOrder.purchaseNo.split('-')[2] || '0', 10);
        nextSeq = lastNum + 1;
      }
      const purchaseNo = `PO-${year}-${String(nextSeq).padStart(4, '0')}`;

      // 計算總金額
      const totalAmount = input.items.reduce((sum, item) => sum + item.subtotal, 0);

      const purchase = await ctx.db.purchase.create({
        data: {
          purchaseNo,
          title: input.title,
          supplier: input.supplier,
          supplierContact: input.supplierContact,
          orderDate: input.orderDate,
          expectedDate: input.expectedDate,
          totalAmount,
          status: input.status,
          notes: input.notes,
          createdById: ctx.session.user.id,
          items: {
            create: input.items.map((item) => ({
              equipmentId: item.equipmentId,
              itemName: item.itemName,
              brand: item.brand,
              model: item.model,
              specification: item.specification,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              receivedQty: item.receivedQty,
            })),
          },
        },
        include: {
          items: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      return purchase;
    }),

  // 📌 更新
  update: protectedProcedure
    .input(updatePurchaseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, items, ...data } = input;

      const existing = await ctx.db.purchase.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '採購單不存在' });
      }

      let totalAmount: number | undefined;
      if (items) {
        totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      }

      // 如果更新了 items，先刪除舊明細再新增
      if (items) {
        await ctx.db.purchaseItem.deleteMany({ where: { purchaseId: id } });
      }

      const purchase = await ctx.db.purchase.update({
        where: { id },
        data: {
          ...data,
          ...(totalAmount !== undefined ? { totalAmount } : {}),
          ...(items
            ? {
                items: {
                  create: items.map((item) => ({
                    equipmentId: item.equipmentId,
                    itemName: item.itemName,
                    brand: item.brand,
                    model: item.model,
                    specification: item.specification,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                    receivedQty: item.receivedQty,
                  })),
                },
              }
            : {}),
        },
        include: {
          items: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      return purchase;
    }),

  // 📌 刪除
delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;  // ← ✅ 先解構出 id

      const existing = await ctx.db.purchase.findUnique({
        where: { id },       // ← ✅ 現在 id 變數存在作用域了
        select: { id: true },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '採購單不存在' });
      }

      await ctx.db.purchase.delete({ where: { id } });  // ← ✅
      return { success: true };
    }),


  // 📌 更新狀態（快捷操作）
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: purchaseStatusEnum,
        receivedDate: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: any = { status: input.status };
      if (input.receivedDate) data.receivedDate = input.receivedDate;

      // 若狀態改成 CANCELLED，清空 receivedDate
      if (input.status === 'CANCELLED') {
        data.receivedDate = null;
      }

      const purchase = await ctx.db.purchase.update({
        where: { id: input.id },
        data,
      });

      return purchase;
    }),
});
