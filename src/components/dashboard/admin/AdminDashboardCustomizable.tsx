'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import type { Layout } from 'react-grid-layout';
import { WidgetGrid } from './WidgetGrid';
import { AdminDashboardSettings } from './AdminDashboardSettings';
import { api } from '@/utils/api';
import type { DashboardWidgetLayout, WidgetWithLayout } from '@/types/dashboard';
import { MetricSelectorPanel } from './metricSelectorPanel';

interface WidgetRaw {
  id: string;
  metricKey: string;
  position: number;
  width: number;
  height: number;
  customTitle: string | null;
  filterConfig: unknown;
  chartConfig: unknown;
  isVisible: boolean;
  layout?: Record<string, unknown> | null;
}

export function AdminDashboardCustomizable() {
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [globalTimeRange, setGlobalTimeRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  const [showMetricPanel, setShowMetricPanel] = useState(false);

  // 🔥 本地 layout 狀態：拖動時即時更新，但不同步到 DB
  // 這樣 react-grid-layout 在拖動過程中能正常顯示
// 🔥 本地 layout 狀態：完整 widget 物件
const [localLayout, setLocalLayout] = useState<WidgetWithLayout[] | null>(null);


  const utils = api.useUtils();

  const { data: dashboards = [] } = api.adminDashboard.getAllDashboardConfigs.useQuery();

  const { data: dashboardConfig, refetch: refetchDashboard } =
    api.adminDashboard.getDashboardConfig.useQuery(
      { dashboardId: activeDashboardId ?? undefined },
      { enabled: activeDashboardId != null },
    );

  // 從 DB 計算 widgets
  const dbWidgets = useMemo(() => {
    if (!dashboardConfig?.widgets) return [];
    return (dashboardConfig.widgets as WidgetRaw[]).map((w) => ({
      id: w.id,
      metricKey: w.metricKey,
      layout: {
        i: w.id,
        x: Number(w.layout?.x) ?? 0,
        y: Number(w.layout?.y) ?? 0,
        w: Number(w.layout?.w) ?? 3,
        h: Number(w.layout?.h) ?? 2,
      } as DashboardWidgetLayout,
    }));
  }, [dashboardConfig]);

  // 🔥 最終使用的 widgets：有 localLayout 時用 local，否則用 DB 的
  // 這樣拖動過程中不會閃回，放開後用 localLayout 保持位置
  // 直到下一次 dashboardConfig 更新（refetchDashboard）後會自動取代 localLayout
  const widgets = localLayout ?? dbWidgets;

// ───────── saveLayoutMutation ─────────
const saveLayoutMutation = api.adminDashboard.saveDashboardConfig.useMutation({
  onSuccess: () => {
    toast.success('佈局已儲存');
    handleSaveSuccess();   // ← 統一處理
  },
  onError: (err) => toast.error(`儲存失敗: ${err.message}`),
});

// 🔥 新增：儲存成功後的統一處理
const handleSaveSuccess = useCallback(() => {
  if (!activeDashboardId) return;
  utils.adminDashboard.getDashboardConfig.invalidate({ dashboardId: activeDashboardId })
    .then(() => refetchDashboard());
}, [activeDashboardId, utils, refetchDashboard]);


  // ───────── createDashboardMutation ─────────
  const createDashboardMutation = api.adminDashboard.createDashboard.useMutation({
    onSuccess: (newDashboard) => {
      toast.success('儀表板已建立');
      setActiveDashboardId(newDashboard.id);
      utils.adminDashboard.getAllDashboardConfigs.invalidate();
    },
    onError: (err) => toast.error(`建立失敗: ${err.message}`),
  });

  // ───────── 刪除儀表板 ─────────
  const handleDeleteDashboard = useCallback((deletedId: string) => {
    if (activeDashboardId === deletedId) {
      setActiveDashboardId(null);
    }
  }, [activeDashboardId]);

  // 自動選第一個儀表板
  useEffect(() => {
    if (!activeDashboardId && dashboards.length > 0) {
      setActiveDashboardId(dashboards[0].id);
    }
  }, [dashboards, activeDashboardId]);

  // 🔥 切換儀表板時，清除本地 layout
  useEffect(() => {
    setLocalLayout(null);
  }, [activeDashboardId]);

  // ═══════════════════════════════════════
  // 🔥 核心修正：onLayoutChange vs onDragStop
  // ═══════════════════════════════════════

  // `onLayoutChange`：只更新本地狀態（讓拖動順暢），不存 DB
// `onLayoutChange`：只更新本地狀態（讓拖動順暢），不存 DB
const handleLayoutChange = useCallback(
  (newLayout: Layout) => {
    if (!dashboardConfig || !activeDashboardId) return;

    // 🔥 從 dbWidgets 取得完整資料，只更新 layout 位置
    const newLocalLayout: WidgetWithLayout[] = newLayout.map((l) => {
      const existing = dbWidgets.find((w) => w.id === l.i);
      return {
        id: l.i,
        metricKey: existing?.metricKey ?? '',
        layout: {
          i: l.i,
          x: Number(l.x),
          y: Number(l.y),
          w: Number(l.w),
          h: Number(l.h),
        },
      };
    });

    setLocalLayout(newLocalLayout);
  },
  [dashboardConfig, activeDashboardId, dbWidgets],
);


  // `onDragStop`：拖動結束後才存 DB（只存一次！）
  const handleDragStop = useCallback(
    (finalLayout: Layout) => {
      if (!dashboardConfig || !activeDashboardId) return;

      // 從 dbWidgets 取得 metricKey（localLayout 沒有 metricKey）
      const updatedWidgets = finalLayout.map((l) => {
        const existing = dbWidgets.find((w) => w.id === l.i);
        return {
          id: l.i,
          metricKey: existing?.metricKey ?? '',
          position: 0,
          layout: {
            i: l.i,
            x: Number(l.x),
            y: Number(l.y),
            w: Number(l.w),
            h: Number(l.h),
          },
        };
      });

      saveLayoutMutation.mutate({
        dashboardId: activeDashboardId,
        widgets: updatedWidgets,
      });
    },
    [dashboardConfig, dbWidgets, saveLayoutMutation, activeDashboardId],
  );

// ───────── addWidget ─────────
const addWidget = useCallback(
  (metricKey: string) => {
    if (!dashboardConfig || !activeDashboardId) return;
    
    setLocalLayout(null);
    
    saveLayoutMutation.mutate(
      {
        dashboardId: activeDashboardId,
        widgets: [
          ...dbWidgets.map((w) => ({
            id: w.id,
            metricKey: w.metricKey,
            position: 0,
            layout: w.layout,
          })),
          {
            metricKey,
            position: dbWidgets.length,
            layout: { x: 0, y: 0, w: 3, h: 2 },
          },
        ],
      },
      {
        onSuccess: () => {
          setShowMetricPanel(false);
          // 🔥 改為 invalidate + refetch 搭配，強制刷新 dashboardConfig
          utils.adminDashboard.getDashboardConfig.invalidate({ dashboardId: activeDashboardId })
            .then(() => {
              refetchDashboard();
            });
        },
      },
    );
  },
  [dashboardConfig, dbWidgets, saveLayoutMutation, activeDashboardId, utils, refetchDashboard],
);

// ───────── removeWidget ─────────
const removeWidget = useCallback(
  (widgetId: string) => {
    if (!dashboardConfig || !activeDashboardId) return;
    
    setLocalLayout(null);
    
    const filtered = dbWidgets.filter((w) => w.id !== widgetId);
    saveLayoutMutation.mutate({
      dashboardId: activeDashboardId,
      widgets: filtered.map((w, index) => ({
        id: w.id,
        metricKey: w.metricKey,
        position: index,
        layout: w.layout,
      })),
    });
    // 🔥 remove 也加上同樣處理（可選，但建議統一）
  },
  [dashboardConfig, dbWidgets, saveLayoutMutation, activeDashboardId],
);


  // ───────── handleDashboardChange ─────────
  const handleDashboardChange = useCallback((newId: string) => {
    setActiveDashboardId(newId);
    setShowMetricPanel(false);
  }, []);

  // ───────── 空儀表板 UI ─────────
  if (!dashboards || dashboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">尚未建立任何儀表板</p>
        <button
          onClick={() => {
            const existing = dashboards.find(d => d.name === '我的儀表板');
            if (existing) {
              setActiveDashboardId(existing.id);
              toast('已存在「我的儀表板」，已為您切換');
            } else {
              createDashboardMutation.mutate({ name: '我的儀表板' });
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + 建立第一個儀表板
        </button>
      </div>
    );
  }

  // ───────── 主要 UI ─────────
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <AdminDashboardSettings
          dashboards={dashboards}
          activeId={activeDashboardId ?? ''}
          onSelect={handleDashboardChange}
          onDelete={handleDeleteDashboard}
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">時間：</label>
          <input
            type="date"
            value={globalTimeRange.start.toISOString().slice(0, 10)}
            onChange={(e) =>
              setGlobalTimeRange((prev) => ({
                ...prev,
                start: new Date(e.target.value),
              }))
            }
            className="border rounded px-2 py-1 text-sm"
          />
          <span className="text-sm">~</span>
          <input
            type="date"
            value={globalTimeRange.end.toISOString().slice(0, 10)}
            onChange={(e) =>
              setGlobalTimeRange((prev) => ({
                ...prev,
                end: new Date(e.target.value),
              }))
            }
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <button
          onClick={() => setShowMetricPanel((v) => !v)}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          {showMetricPanel ? '關閉指標面板' : '新增指標'}
        </button>
      </div>

      <div className="flex gap-4">
        {showMetricPanel && (
          <div className="w-64 flex-shrink-0">
            <MetricSelectorPanel onAdd={addWidget} />
          </div>
        )}
        <div className="flex-1">
          {dashboardConfig && (
            <WidgetGrid
              widgets={widgets}
              globalTimeRange={globalTimeRange}
              onLayoutChange={handleLayoutChange}
              onDragStop={handleDragStop}    // 🔥 新增
              onRemove={removeWidget}
            />
          )}
        </div>
      </div>
    </div>
  );
}
