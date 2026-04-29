// server/routers/projectMessage.ts
import { protectedProcedure, router } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const projectMessageRouter = router({

  // ===== 取得 Sales 手上的專案列表 =====
  getSalesProjects: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.project.findMany({
        where: { salesId: ctx.user.id },
        include: {
          customer: true,
          pm: { select: { id: true, name: true } },
          quotation: {
            include: {
              versions: {
                orderBy: { versionNumber: "desc" },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  // ===== 取得某專案的對話紀錄 =====
  getProjectMessages: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // 1. 先確認該專案存在，且使用者是 Sales 或 PM
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: { salesId: true, pmId: true },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "專案不存在" });
      }

      if (project.salesId !== ctx.user.id && project.pmId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "你不是此專案的 Sales 或 PM" });
      }

      // 2. 回傳對話紀錄
      return await ctx.db.projectMessage.findMany({
        where: { projectId: input.projectId },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  // ===== 發送對話訊息 =====
  sendProjectMessage: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      content: z.string().min(1, "訊息不可為空").max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. 確認使用者是此專案的 Sales 或 PM
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: { salesId: true, pmId: true },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "專案不存在" });
      }

      if (project.salesId !== ctx.user.id && project.pmId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "你不是此專案的 Sales 或 PM" });
      }

      // 2. 建立訊息
      return await ctx.db.projectMessage.create({
        data: {
          projectId: input.projectId,
          content: input.content,
          senderId: ctx.user.id,
        },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      });
    }),
});
