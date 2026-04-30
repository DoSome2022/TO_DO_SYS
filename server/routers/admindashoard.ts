// server/api/routers/admin/dashboard.ts
import { z } from "zod";

import { DASHBOARD_METRICS } from "@/lib/dashboard/metrics";
import { protectedProcedure, router } from "../trpc";
import { executeMetricQuery } from "@/lib/dashboard/query-engine";
import { createDefaultDashboard } from "@/lib/dashboard/default-dashboard";

export const adminDashboardRouter = router({
  // ───────── 既有的四個端點 ─────────

  // 1. 取得所有可用的指標目錄
  getMetricsCatalog: protectedProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return DASHBOARD_METRICS.map((m) => ({
        key: m.key,
        label: m.label,
        description: m.description,
        category: m.category,
        displayType: m.displayType,
        icon: m.icon,
      }));
    }),

  // 2. 取得 Admin 的儀表板配置
  getDashboardConfig: protectedProcedure
    .input(
      z
        .object({
          dashboardId: z.string().optional(), // 🔁 number → string
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const dashboardId = input?.dashboardId;

      const dashboard = await ctx.db.adminDashboard.findFirst({
        where: dashboardId
          ? { id: dashboardId, userId }
          : { userId, isDefault: true },
        include: {
          widgets: {
            where: { isVisible: true },
            orderBy: { position: "asc" },
          },
        },
      });

      if (!dashboard) {
        return createDefaultDashboard(ctx.db, userId);
      }

      return dashboard;
    }),

  // 3. 儲存/更新儀表板配置
  saveDashboardConfig: protectedProcedure
    .input(
      z.object({
        dashboardId: z.string().optional(), // 🔁 number → string
        name: z.string().optional(),
        widgets: z.array(
          z.object({
            id: z.string().optional(),       // 🔁 number → string
            metricKey: z.string(),
            position: z.number(),
            layout: z.record(z.string(), z.any()),
            customTitle: z.string().optional(),
            filterConfig: z.any().optional(),
            chartConfig: z.any().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // 1. 取得或建立儀表板
      let dashboard = await ctx.db.adminDashboard.findFirst({
        where: input.dashboardId
          ? { id: input.dashboardId, userId }
          : { userId, isDefault: true },
      });

      if (!dashboard) {
        dashboard = await ctx.db.adminDashboard.create({
          data: {
            userId,
            name: input.name ?? "預設儀表板",
            isDefault: true,
          },
        });
      } else if (input.name) {
        await ctx.db.adminDashboard.update({
          where: { id: dashboard.id },
          data: { name: input.name },
        });
      }

      // 2. 刪除所有舊 widget，重新建立
      await ctx.db.dashboardWidget.deleteMany({
        where: { dashboardId: dashboard.id },
      });

      // 3. 批量建立新 widgets
      if (input.widgets.length > 0) {
        await ctx.db.dashboardWidget.createMany({
          data: input.widgets.map((w) => ({
            dashboardId: dashboard.id,
            metricKey: w.metricKey,
            position: w.position,
            layout: w.layout,
            customTitle: w.customTitle,
            filterConfig: w.filterConfig ?? {},
            chartConfig: w.chartConfig ?? {},
          })),
        });
      }

      // 4. 回傳更新後的儀表板
      return ctx.db.adminDashboard.findUnique({
        where: { id: dashboard.id },
        include: {
          widgets: {
            where: { isVisible: true },
            orderBy: { position: "asc" },
          },
        },
      });
    }),

  // 4. 查詢單一指標的實際數據
  queryMetric: protectedProcedure
    .input(
      z.object({
        metricKey: z.string(),
        filters: z.any().optional(),
          dateRange: z
          .object({
            start: z.string(),
            end: z.string(),
          })
          .optional(),  // ← 改為物件
      }),
    )
    .query(async ({ ctx, input }) => {
      const metric = DASHBOARD_METRICS.find(
        (m) => m.key === input.metricKey,
      );
      if (!metric) throw new Error(`Metric ${input.metricKey} not found`);

      return await executeMetricQuery(ctx.db, metric, input);
    }),

  // ───────── 新增的三個端點 ─────────

  getAllDashboardConfigs: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.adminDashboard.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  createDashboard: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "儀表板名稱不可為空"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const dashboard = await ctx.db.adminDashboard.create({
        data: {
          userId,
          name: input.name,
          isDefault: false,
        },
      });
      return dashboard;
    }),

  deleteDashboard: protectedProcedure
    .input(
      z.object({
        dashboardId: z.string(), // 🔁 number → string
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const dashboard = await ctx.db.adminDashboard.findFirst({
        where: { id: input.dashboardId, userId },
      });

      if (!dashboard) {
        throw new Error("儀表板不存在或無權限");
      }

      const count = await ctx.db.adminDashboard.count({
        where: { userId },
      });

      if (count <= 1) {
        throw new Error("至少需要保留一個儀表板");
      }

      if (dashboard.isDefault) {
        const nextDashboard = await ctx.db.adminDashboard.findFirst({
          where: { userId, id: { not: input.dashboardId } },
          orderBy: { createdAt: "asc" },
        });

        if (nextDashboard) {
          await ctx.db.adminDashboard.update({
            where: { id: nextDashboard.id },
            data: { isDefault: true },
          });
        }
      }

      await ctx.db.dashboardWidget.deleteMany({
        where: { dashboardId: input.dashboardId },
      });

      await ctx.db.adminDashboard.delete({
        where: { id: input.dashboardId },
      });

      return { success: true };
    }),
});
