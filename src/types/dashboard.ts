// types/dashboard.ts
import type { MetricDefinition } from './dashboard-metrics';

/** 儀表板 Widget 的佈局資訊（對應 react-grid-layout 的 Layout 介面） */
export interface DashboardWidgetLayout {
  i: string;          // ← 這是 react-grid-layout 必備的 key
  x: number;
  y: number;
  w: number;
  h: number;
  static?: boolean;
}

/** 從資料庫取得的 Widget（含 Prisma 回傳的 layout Json） */
export interface WidgetFromDb {
  id: string;
  dashboardId: number;
  metricKey: string;
  position: number;
  width: number;
  height: number;
  customTitle: string | null;
  filterConfig: unknown;
  chartConfig: unknown;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** 資料庫中存的是 Json，使用時需轉為 DashboardWidgetLayout */
  layout?: DashboardWidgetLayout;
}

/** WidgetCard 與 WidgetGrid 使用的 Widget（已解析 layout） */
export interface WidgetWithLayout {
  id: string;
  metricKey: string;
  layout: DashboardWidgetLayout;
  /** 可選的客製標題 */
  customTitle?: string | null;
  /** 可選的指標定義完整資訊 */
  metricDefinition?: MetricDefinition;
}

/** 儀表板配置（含 Widget 列表） */
export interface DashboardConfig {
  id: string;
  userId: number;
  name: string;
  isDefault: boolean;
  widgets: WidgetWithLayout[];
  createdAt: Date;
  updatedAt: Date;
}

/** 儀表板簡要資訊（用於頁籤列表） */
export interface DashboardBrief {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** tRPC saveDashboardConfig 的 input 型別 */
export interface SaveDashboardInput {
  dashboardId?: number;
  name?: string;
  widgets: Array<{
    id?: string;
    metricKey: string;
    position: number;
    width: number;
    height: number;
    customTitle?: string;
    filterConfig?: unknown;
    chartConfig?: unknown;
  }>;
}
