// types/dashboard-metrics.ts

// 指標類別
export type MetricCategory = 
  | 'users'       // 用戶與權限
  | 'projects'    // 專案管理
  | 'sales'       // 銷售與報價
  | 'equipment'   // 設備管理
  | 'tasks'       // 任務管理
  | 'customers'   // 客戶服務
  | 'system';     // 系統設定

// 顯示類型
export type DisplayType = 
  | 'NUMBER'      // 單一數字 (如: 128)
  | 'RATIO'       // 比例 (如: 56/62)
  | 'PERCENTAGE'  // 百分比 (如: 85%)
  | 'CHART_BAR'   // 長條圖
  | 'CHART_PIE'   // 圓餅圖
  | 'CHART_LINE'  // 折線圖
  | 'LIST'        // 列表 (前N筆)
  | 'TABLE';      // 表格

// 時間範圍
export type DateRange = 
  | 'ALL'         // 全部
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'THIS_YEAR'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'CUSTOM';     // 自訂日期範圍

// 單一指標定義
export interface MetricDefinition {
  key: string;            // 唯一識別碼，如 "total_users"
  label: string;          // 顯示名稱，如 "系統總用戶數"
  description: string;    // 說明
  category: MetricCategory;
  displayType: DisplayType;
  icon: string;           // lucide icon name
  
  // 關聯解析提示
  resolveRelations: {
    field: string;        // 需要解析的欄位名
    displayField: string; // 顯示用欄位，如 "name"
    model: string;        // 關聯的 Model
  }[];
  
  // 預設配置
  defaultConfig: {
    dateRange?: DateRange;
    filters?: Record<string, any>;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}
