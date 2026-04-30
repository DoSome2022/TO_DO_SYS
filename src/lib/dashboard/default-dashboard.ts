// // lib/dashboard/default-dashboard.ts
// import type { AdminDashboard, DashboardWidget } from "@prisma/client";
// import type { PrismaClient } from "@prisma/client";

// /**
//  * 預設儀表板配置：新 Admin 用戶第一次進入時自動建立的內容
//  * 
//  * 這裡我選了 8 個最通用的指標，涵蓋所有 7 大領域
//  */
// const DEFAULT_WIDGETS = [
//   // 第 1 行：使用者 + 專案
//   { metricKey: "total_users",           position: 0, width: 1, height: 1, customTitle: "系統總用戶" },
//   { metricKey: "active_users",          position: 1, width: 1, height: 1, customTitle: "活躍用戶" },
//   { metricKey: "active_projects",       position: 2, width: 1, height: 1, customTitle: "運行中專案" },
//   { metricKey: "pending_versions",      position: 3, width: 1, height: 1, customTitle: "待審核版本" },

//   // 第 2 行：銷售 + 設備 + 客戶
//   { metricKey: "total_quotations",      position: 4, width: 1, height: 1, customTitle: "總報價單" },
//   { metricKey: "available_equipment",   position: 5, width: 1, height: 1, customTitle: "可用設備" },
//   { metricKey: "total_customers",       position: 6, width: 1, height: 1, customTitle: "總客戶數" },
//   { metricKey: "pending_collaboration_requests", position: 7, width: 1, height: 1, customTitle: "待處理合作" },

//   // 第 3 行：圖表類（佔兩欄寬）
//   { metricKey: "projects_by_status",    position: 8,  width: 2, height: 2, customTitle: "專案狀態分布" },
//   { metricKey: "equipment_by_status",   position: 10, width: 2, height: 2, customTitle: "設備狀態分布" },

//   // 第 4 行：列表類
//   { metricKey: "overdue_equipment_logs", position: 12, width: 2, height: 2, customTitle: "逾期未還設備" },
//   { metricKey: "overdue_todos",         position: 14, width: 2, height: 2, customTitle: "逾期待辦事項" },
// ];

// /**
//  * 為指定 Admin 用戶建立預設儀表板
//  * 
//  * @param db    - Prisma Client 實例
//  * @param userId - 管理員的 User ID
//  * @returns 包含 Widgets 的完整儀表板
//  */
// export async function createDefaultDashboard(
//   db: PrismaClient,
//   userId: string
// ): Promise<AdminDashboard & { widgets: DashboardWidget[] }> {
  
//   // 1. 建立預設儀表板
//   const dashboard = await db.adminDashboard.create({
//     data: {
//       name: "我的管理儀表板",
//       userId,
//       isDefault: true,
//       order: 0,
//       layout: { columns: 4, gap: 4 },   // 4 欄佈局
//     },
//   });

//   // 2. 批次建立所有預設 Widget
//   await db.dashboardWidget.createMany({
//     data: DEFAULT_WIDGETS.map((w, index) => ({
//       dashboardId: dashboard.id,
//       metricKey: w.metricKey,
//       position: w.position,
//       width: w.width,
//       height: w.height,
//       customTitle: w.customTitle,
//       isVisible: true,
//       // 可以為某些 Widget 設定預設的圖表配置
//       chartConfig: getDefaultChartConfig(w.metricKey),
//       filterConfig: getDefaultFilterConfig(w.metricKey),
//     })),
//   });

//   // 3. 回傳完整的儀表板（含 Widgets）
//   return await db.adminDashboard.findUnique({
//     where: { id: dashboard.id },
//     include: {
//       widgets: {
//         where: { isVisible: true },
//         orderBy: { position: 'asc' },
//       },
//     },
//   }) as AdminDashboard & { widgets: DashboardWidget[] };
// }

// /**
//  * 根據指標類型，回傳預設的圖表設定
//  */
// function getDefaultChartConfig(metricKey: string): Record<string, any> | null {
//   const chartMetrics: Record<string, any> = {
//     "projects_by_status": {
//       chartType: "PIE",
//       showLegend: true,
//       showPercentage: true,
//     },
//     "equipment_by_status": {
//       chartType: "PIE",
//       showLegend: true,
//       showPercentage: true,
//     },
//     "users_by_position": {
//       chartType: "PIE",
//       showLegend: true,
//     },
//     "users_by_role": {
//       chartType: "BAR",
//       showLegend: false,
//     },
//     "projects_by_pm": {
//       chartType: "BAR",
//       showLegend: false,
//     },
//     "quotations_by_sales": {
//       chartType: "BAR",
//       showLegend: false,
//     },
//   };

//   return chartMetrics[metricKey] || null;
// }

// /**
//  * 根據指標類型，回傳預設的篩選條件
//  */
// function getDefaultFilterConfig(metricKey: string): Record<string, any> | null {
//   const filterConfigs: Record<string, any> = {
//     "active_projects": {
//       status: "IN_PROGRESS",
//     },
//     "pending_versions": {
//       reviewStatus: "PENDING",
//     },
//     "available_equipment": {
//       status: "AVAILABLE",
//     },
//     "pending_collaboration_requests": {
//       status: "PENDING",
//     },
//   };

//   return filterConfigs[metricKey] || null;
// }




import type { AdminDashboard, DashboardWidget } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

/**
 * 預設儀表板配置：新 Admin 用戶第一次進入時自動建立的內容
 */
const DEFAULT_WIDGETS = [
  { metricKey: "total_users",           position: 0, width: 1, height: 1, customTitle: "系統總用戶" },
  { metricKey: "active_users",          position: 1, width: 1, height: 1, customTitle: "活躍用戶" },
  { metricKey: "active_projects",       position: 2, width: 1, height: 1, customTitle: "運行中專案" },
  { metricKey: "pending_versions",      position: 3, width: 1, height: 1, customTitle: "待審核版本" },
  { metricKey: "total_quotations",      position: 4, width: 1, height: 1, customTitle: "總報價單" },
  { metricKey: "available_equipment",   position: 5, width: 1, height: 1, customTitle: "可用設備" },
  { metricKey: "total_customers",       position: 6, width: 1, height: 1, customTitle: "總客戶數" },
  { metricKey: "pending_collaboration_requests", position: 7, width: 1, height: 1, customTitle: "待處理合作" },
  { metricKey: "projects_by_status",    position: 8,  width: 2, height: 2, customTitle: "專案狀態分布" },
  { metricKey: "equipment_by_status",   position: 10, width: 2, height: 2, customTitle: "設備狀態分布" },
  { metricKey: "overdue_equipment_logs", position: 12, width: 2, height: 2, customTitle: "逾期未還設備" },
  { metricKey: "overdue_todos",         position: 14, width: 2, height: 2, customTitle: "逾期待辦事項" },
];

/**
 * 為指定 Admin 用戶建立預設儀表板
 */
export async function createDefaultDashboard(
  db: PrismaClient,
  userId: string
): Promise<AdminDashboard & { widgets: DashboardWidget[] }> {
  
  // 1. 建立預設儀表板
  const dashboard = await db.adminDashboard.create({
    data: {
      name: "我的管理儀表板",
      userId,
      isDefault: true,
      order: 0,
      layout: { columns: 4, gap: 4 },
    },
  });

  // 2. 批次建立所有預設 Widget
  await db.dashboardWidget.createMany({
    data: DEFAULT_WIDGETS.map((w) => {
      const chartConfig = getDefaultChartConfig(w.metricKey);
      const filterConfig = getDefaultFilterConfig(w.metricKey);
      
      return {
        dashboardId: dashboard.id,
        metricKey: w.metricKey,
        position: w.position,
        width: w.width,
        height: w.height,
        customTitle: w.customTitle,
        isVisible: true,
        // ★ 關鍵：undefined 就不帶入，避免 type error
        ...(chartConfig !== undefined ? { chartConfig } : {}),
        ...(filterConfig !== undefined ? { filterConfig } : {}),
      };
    }),
  });

  // 3. 回傳完整的儀表板
  return await db.adminDashboard.findUnique({
    where: { id: dashboard.id },
    include: {
      widgets: {
        where: { isVisible: true },
        orderBy: { position: 'asc' },
      },
    },
  }) as AdminDashboard & { widgets: DashboardWidget[] };
}

/**
 * 根據指標類型，回傳預設的圖表設定
 * undefined = 不寫入該欄位
 */
function getDefaultChartConfig(metricKey: string): Record<string, any> | undefined {
  const chartMetrics: Record<string, any> = {
    "projects_by_status":    { chartType: "PIE", showLegend: true, showPercentage: true },
    "equipment_by_status":   { chartType: "PIE", showLegend: true, showPercentage: true },
    "users_by_position":     { chartType: "PIE", showLegend: true },
    "users_by_role":         { chartType: "BAR", showLegend: false },
    "projects_by_pm":        { chartType: "BAR", showLegend: false },
    "quotations_by_sales":   { chartType: "BAR", showLegend: false },
  };

  return chartMetrics[metricKey];
}

/**
 * 根據指標類型，回傳預設的篩選條件
 * undefined = 不寫入該欄位
 */
function getDefaultFilterConfig(metricKey: string): Record<string, any> | undefined {
  const filterConfigs: Record<string, any> = {
    "active_projects":                { status: "IN_PROGRESS" },
    "pending_versions":               { reviewStatus: "PENDING" },
    "available_equipment":            { status: "AVAILABLE" },
    "pending_collaboration_requests": { status: "PENDING" },
  };

  return filterConfigs[metricKey];
}
