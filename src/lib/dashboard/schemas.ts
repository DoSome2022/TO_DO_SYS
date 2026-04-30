import { z } from "zod";

// ============================================================
// 1. 列舉與類型定義
// ============================================================

/** 指標分組類別（7 大領域） */
export const MetricCategory = {
  USERS:       "users",
  PROJECTS:    "projects",
  SALES:       "sales",
  EQUIPMENT:   "equipment",
  TASKS:       "tasks",
  CUSTOMERS:   "customers",
  SYSTEM:      "system",
} as const;
export type MetricCategory = (typeof MetricCategory)[keyof typeof MetricCategory];

export const MetricCategoryLabel: Record<MetricCategory, string> = {
  users:     "用戶",
  projects:  "專案",
  sales:     "銷售",
  equipment: "設備",
  tasks:     "任務",
  customers: "客戶",
  system:    "系統",
};

/** 顯示類型 */
export const DisplayType = {
  NUMBER: "number",
  CHART:  "chart",
  LIST:   "list",
  MIXED:  "mixed",     // 數字 + 列表混合（如 win_rate 含 details）
} as const;
export type DisplayType = (typeof DisplayType)[keyof typeof DisplayType];

/** 圖表類型 */
export const ChartType = {
  BAR:  "bar",
  PIE:  "pie",
  LINE: "line",
  DOUGHNUT: "doughnut",
} as const;
export type ChartType = (typeof ChartType)[keyof typeof ChartType];

/** 指標預設大小（Grid col-span） */
export const WidgetSize = {
  SMALL:  "small",   // 1 col — 純數字
  MEDIUM: "medium",  // 2 col — 圖表/列表
  LARGE:  "large",   // 3 col — 大圖表
} as const;
export type WidgetSize = (typeof WidgetSize)[keyof typeof WidgetSize];

// ============================================================
// 2. Metric Schema 定義（單一指標的完整元資料）
// ============================================================

export interface MetricSchema {
  key: string;
  label: string;
  description: string;
  category: MetricCategory;
  displayType: DisplayType;
  chartType?: ChartType;        // 僅 displayType = chart 時需要
  defaultSize: WidgetSize;
  /** 是否為「純計數」，這類指標不需過濾器即可快速顯示 */
  isSimpleCount?: boolean;
  /** 管理員限定？某些敏感指標（如金額）僅 Admin 可看 */
  adminOnly?: boolean;
}

// ============================================================
// 3. 完整指標註冊表（所有可用的 Metric）
// ============================================================

export const METRIC_REGISTRY: MetricSchema[] = [
  // ----- 用戶 -----
  {
    key: "total_users",
    label: "總用戶數",
    description: "系統中所有註冊用戶的總數",
    category: "users",
    displayType: "number",
    defaultSize: "small",
    isSimpleCount: true,
  },
  {
    key: "active_users",
    label: "活躍用戶數",
    description: "目前標記為啟用狀態的用戶數量",
    category: "users",
    displayType: "number",
    defaultSize: "small",
    isSimpleCount: true,
  },
  {
    key: "users_by_position",
    label: "各職位人數分佈",
    description: "依用戶職位分組統計人數",
    category: "users",
    displayType: "chart",
    chartType: "bar",
    defaultSize: "medium",
  },
  {
    key: "users_by_role",
    label: "各角色人數分佈",
    description: "依用戶角色（ADMIN / SALES / PM / STAFF）分組統計",
    category: "users",
    displayType: "chart",
    chartType: "pie",
    defaultSize: "medium",
  },

  // ----- 專案 -----
  {
    key: "active_projects",
    label: "進行中專案數",
    description: "目前狀態為 IN_PROGRESS 的專案數量",
    category: "projects",
    displayType: "number",
    defaultSize: "small",
    isSimpleCount: true,
  },
  {
    key: "projects_by_status",
    label: "專案狀態分佈",
    description: "依專案狀態分組統計（規劃中/進行中/已完成/暫停/取消）",
    category: "projects",
    displayType: "chart",
    chartType: "doughnut",
    defaultSize: "medium",
  },
  {
    key: "overdue_projects",
    label: "逾期專案數",
    description: "超過 endDate 且仍在進行中的專案數量",
    category: "projects",
    displayType: "number",
    defaultSize: "small",
  },
  {
    key: "projects_by_pm",
    label: "PM 負責專案數",
    description: "依專案經理分組統計負責的專案數量（Top 10）",
    category: "projects",
    displayType: "chart",
    chartType: "bar",
    defaultSize: "medium",
  },
  {
    key: "pending_versions",
    label: "待審核版本數",
    description: "WorkVersion 中 reviewStatus 為 PENDING 的數量",
    category: "projects",
    displayType: "number",
    defaultSize: "small",
    isSimpleCount: true,
  },

  // ----- 銷售 -----
  {
    key: "total_quotations",
    label: "總報價單數",
    description: "系統中所有報價單的總數",
    category: "sales",
    displayType: "number",
    defaultSize: "small",
    isSimpleCount: true,
  },
  {
    key: "win_rate",
    label: "成交率",
    description: "已成交報價單佔總報價單的百分比（含 details）",
    category: "sales",
    displayType: "mixed",
    defaultSize: "small",
  },
  {
    key: "total_quotation_amount",
    label: "報價總金額",
    description: "所有報價單 totalAmount 的加總",
    category: "sales",
    displayType: "number",
    defaultSize: "small",
    adminOnly: true,
  },
  {
    key: "quotations_by_sales",
    label: "業務員報價統計",
    description: "依業務員分組統計報價單數量與總金額（Top 10）",
    category: "sales",
    displayType: "chart",
    chartType: "bar",
    defaultSize: "large",
  },

  // ----- 設備 -----
  {
    key: "available_equipment",
    label: "可用設備數",
    description: "目前狀態為 AVAILABLE 的設備數量",
    category: "equipment",
    displayType: "number",
    defaultSize: "small",
    isSimpleCount: true,
  },
  {
    key: "equipment_by_status",
    label: "設備狀態分佈",
    description: "依設備狀態分組統計",
    category: "equipment",
    displayType: "chart",
    chartType: "pie",
    defaultSize: "medium",
  },
  {
    key: "equipment_asset_value",
    label: "設備資產總值",
    description: "所有設備 value 欄位的加總",
    category: "equipment",
    displayType: "number",
    defaultSize: "small",
    adminOnly: true,
  },
  {
    key: "maintenance_cost",
    label: "本月維護費用",
    description: "當月所有 MaintenanceRecord 的 cost 加總",
    category: "equipment",
    displayType: "number",
    defaultSize: "small",
    adminOnly: true,
  },
  {
    key: "overdue_equipment_logs",
    label: "逾期未還設備",
    description: "超過 dueAt 仍未歸還的設備借用記錄（Top 10）",
    category: "equipment",
    displayType: "list",
    defaultSize: "medium",
  },

  // ----- 任務 -----
  {
    key: "staff_todo_completion_rate",
    label: "待辦事項完成率",
    description: "Staff_TODO 中已完成佔總數的百分比",
    category: "tasks",
    displayType: "mixed",
    defaultSize: "small",
  },
  {
    key: "overdue_todos",
    label: "逾期待辦事項",
    description: "超過 targetDate 且未完成的待辦事項列表",
    category: "tasks",
    displayType: "list",
    defaultSize: "medium",
  },

  // ----- 客戶 -----
  {
    key: "total_customers",
    label: "總客戶數",
    description: "系統中所有客戶的總數",
    category: "customers",
    displayType: "number",
    defaultSize: "small",
    isSimpleCount: true,
  },
  {
    key: "pending_collaboration_requests",
    label: "待處理合作請求",
    description: "CollaborationRequest 中 status 為 PENDING 的數量",
    category: "customers",
    displayType: "number",
    defaultSize: "small",
    isSimpleCount: true,
  },
];

// ============================================================
// 4. 輔助函式：依類別取得指標
// ============================================================

/** 依類別過濾指標 */
export function getMetricsByCategory(category: MetricCategory): MetricSchema[] {
  return METRIC_REGISTRY.filter(m => m.category === category);
}

/** 依 key 取得單一指標定義 */
export function getMetricByKey(key: string): MetricSchema | undefined {
  return METRIC_REGISTRY.find(m => m.key === key);
}

/** 取得某類別的所有指標 key（供權限過濾使用） */
export function getMetricKeysByCategory(category: MetricCategory): string[] {
  return getMetricsByCategory(category).map(m => m.key);
}

/** 取得所有非 adminOnly 的指標（供一般角色使用） */
export function getPublicMetrics(): MetricSchema[] {
  return METRIC_REGISTRY.filter(m => !m.adminOnly);
}

// ============================================================
// 5. Zod Validation Schemas（儀表板配置驗證）
// ============================================================

/** Widget 位置與大小 */
export const WidgetPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(6),  // Grid 寬度（col）
  h: z.number().int().min(1).max(4),  // Grid 高度（row）
});

/** 單一 Widget 配置 */
export const DashboardWidgetSchema = z.object({
  id: z.string().optional(),           // 新增時不帶 id，由 Prisma auto-generate
  metricKey: z.string(),
  title: z.string().min(1, "請輸入 Widget 標題"),
  position: WidgetPositionSchema,
  filters: z.record(z.string(), z.any()).optional().default({}),
});

/** 儀表板配置 */
export const DashboardConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "請輸入儀表板名稱").default("預設儀表板"),
  widgets: z.array(DashboardWidgetSchema).default([]),
  isDefault: z.boolean().default(false),
});

/** 儲存儀表板時的前端請求 */
export const SaveDashboardInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  widgets: z.array(DashboardWidgetSchema),
});

export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;
export type DashboardWidgetInput = z.infer<typeof DashboardWidgetSchema>;
export type DashboardConfigInput = z.infer<typeof DashboardConfigSchema>;
export type SaveDashboardInput = z.infer<typeof SaveDashboardInputSchema>;

// ============================================================
// 6. 預設儀表板（首次使用時自動建立的 12 個 Widget）
// ============================================================

import type { Prisma } from "@prisma/client";

/**
 * 預設 Widget 列表 — 首次進入時自動加入 12 個 Widget
 * 包含：4 個統計數字 + 6 個圖表 + 2 個列表
 */
export const DEFAULT_WIDGETS: Array<{
  metricKey: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  filters?: Record<string, unknown>;
}> = [
  // ===== Row 1：4 個數字（各 3 col）=====
  { metricKey: "total_users",      title: "總用戶數",    position: { x: 0, y: 0, w: 3, h: 1 } },
  { metricKey: "active_projects",  title: "進行中專案",  position: { x: 3, y: 0, w: 3, h: 1 } },
  { metricKey: "total_quotations", title: "報價單總數",  position: { x: 6, y: 0, w: 3, h: 1 } },
  { metricKey: "total_customers",  title: "客戶總數",    position: { x: 9, y: 0, w: 3, h: 1 } },

  // ===== Row 2：2 個圖表（各 6 col）=====
  { metricKey: "projects_by_status", title: "專案狀態分佈", position: { x: 0, y: 1, w: 6, h: 2 } },
  { metricKey: "users_by_role",      title: "用戶角色分佈", position: { x: 6, y: 1, w: 6, h: 2 } },

  // ===== Row 3：2 個圖表（各 6 col）=====
  { metricKey: "equipment_by_status", title: "設備狀態分佈",    position: { x: 0, y: 3, w: 6, h: 2 } },
  { metricKey: "quotations_by_sales", title: "業務員報價統計",  position: { x: 6, y: 3, w: 6, h: 2 } },

  // ===== Row 4：1 個列表（左 6 col）+ 1 個數字（右 6 col）=====
  { metricKey: "overdue_equipment_logs", title: "逾期未還設備", position: { x: 0, y: 5, w: 6, h: 2 } },
  { metricKey: "staff_todo_completion_rate", title: "待辦完成率", position: { x: 6, y: 5, w: 3, h: 1 } },

  // ===== Row 5 底部 =====
  { metricKey: "overdue_todos", title: "逾期待辦事項", position: { x: 0, y: 7, w: 6, h: 2 } },
  { metricKey: "win_rate",      title: "成交率",       position: { x: 6, y: 6, w: 3, h: 1 } },
];

/**
 * 將預設 Widget 轉換為 Prisma create 可用的格式
 */
export function getDefaultWidgetsCreateData(): Prisma.DashboardWidgetCreateWithoutDashboardInput[] {
  return DEFAULT_WIDGETS.map((w, index) => ({
    metricKey: w.metricKey,
    title: w.title,
    // position 是 Int（排序序號），不是佈局物件
    position: index,
    // 佈局資訊存在 layout JSON 欄位
    layout: w.position as Prisma.JsonObject,
    // 過濾器存在 filters JSON 欄位
    filters: (w.filters ?? {}) as Prisma.JsonObject,
  }));
}
