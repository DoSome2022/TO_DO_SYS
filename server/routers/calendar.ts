// server/routers/calendar.ts
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const calendarRouter = router({
  // 📅 取得行事曆事件（依角色過濾）
  getEvents: protectedProcedure
    .input(
      z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        include: { position: true },
      });

      const isAdmin =
        user?.role === "ADMIN" ||
        user?.role === "SUPER_ADMIN" ||
        user?.position?.name?.toLowerCase().includes("admin");

      // 該月份的起訖
      const monthStart = new Date(input.year, input.month - 1, 1);
      const monthEnd = new Date(input.year, input.month, 0, 23, 59, 59, 999);

      // ───────── ① 抓專案（依角色） ─────────
      const projectWhere: any = {
        OR: [
          { startDate: { lte: monthEnd } },
          { endDate: { gte: monthStart } },
        ],
        // 只抓跟這個月有交集的
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      };

      if (!isAdmin) {
        // 非 Admin：只看跟自己有關的專案
        projectWhere.OR = [
          { salesId: userId },
          { pmId: userId },
          { members: { some: { userId } } },
        ];
        // 保留日期過濾
        projectWhere.startDate = { lte: monthEnd };
        projectWhere.endDate = { gte: monthStart };
      }

      const projects = await ctx.db.project.findMany({
        where: projectWhere,
        select: {
          id: true,
          title: true,
          code: true,
          startDate: true,
          endDate: true,
          status: true,
          priority: true,
          salesId: true,
          pmId: true,
          sales: { select: { id: true, name: true } },
          pm: { select: { id: true, name: true } },
          members: {
            where: { userId },
            select: { role: true },
          },
          _count: {
            select: { workItems: true },
          },
        },
      });

      // ───────── ② 抓 WorkItem（只限 Staff/PM 角色） ─────────
      let workItems: any[] = [];
      if (!isAdmin) {
        workItems = await ctx.db.workItem.findMany({
          where: {
            staffId: userId,
            OR: [
              { targetDate: { gte: monthStart, lte: monthEnd } },
              { deadline: { gte: monthStart, lte: monthEnd } },
            ],
          },
          select: {
            id: true,
            title: true,
            targetDate: true,
            deadline: true,
            isCompleted: true,
            isConfirmed: true,
            projectId: true,
            project: { select: { id: true, title: true, code: true } },
          },
        });
      }

      // ───────── ③ 組裝回傳 ─────────
      return {
        projects: projects.map((p) => ({
          id: p.id,
          title: p.title,
          code: p.code,
          startDate: p.startDate,
          endDate: p.endDate,
          status: p.status,
          priority: p.priority,
          // 標示使用者在此專案的角色
          myRole: isAdmin
            ? "ADMIN"
            : p.salesId === userId
            ? "SALES"
            : p.pmId === userId
            ? "PM"
            : p.members[0]?.role ?? "STAFF",
          salesName: p.sales?.name ?? null,
          pmName: p.pm?.name ?? null,
        })),
        workItems: workItems.map((w) => ({
          id: w.id,
          title: w.title,
          targetDate: w.targetDate,
          deadline: w.deadline,
          isCompleted: w.isCompleted,
          isConfirmed: w.isConfirmed,
          projectTitle: w.project?.title ?? "",
          projectCode: w.project?.code ?? "",
        })),
      };
    }),
});
