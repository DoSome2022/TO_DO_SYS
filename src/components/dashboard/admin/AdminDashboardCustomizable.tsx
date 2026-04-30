// src/components/dashboard/admin/AdminDashboardCustomizable.tsx

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import type { Layout, LayoutItem } from 'react-grid-layout';  // 🔁 改為 type import + 加 LayoutItem
import { WidgetGrid } from './WidgetGrid';
import { AdminDashboardSettings } from './AdminDashboardSettings';
import { api } from '@/utils/api';
import type { DashboardWidgetLayout } from '@/types/dashboard';
import { MetricSelectorPanel } from './metricSelectorPanel';

// ---------- 輔助型別 ----------
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

interface DashboardRaw {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  widgets?: WidgetRaw[];
}
// ----------------------------

export function AdminDashboardCustomizable() {
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [globalTimeRange, setGlobalTimeRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  const [showMetricPanel, setShowMetricPanel] = useState(false);

  const [isInitialLayout, setIsInitialLayout] = useState(true);

  const { data: dashboards = [] } = api.adminDashboard.getAllDashboardConfigs.useQuery();

  const { data: dashboardConfig, refetch: refetchDashboard } =
    api.adminDashboard.getDashboardConfig.useQuery(
      { dashboardId: activeDashboardId ?? undefined },
      { enabled: activeDashboardId != null },
    );

  const saveLayoutMutation = api.adminDashboard.saveDashboardConfig.useMutation({
    onSuccess: () => {
      toast.success('佈局已儲存');
      refetchDashboard();
    },
    onError: (err) => toast.error(`儲存失敗: ${err.message}`),
  });

  const createDashboardMutation = api.adminDashboard.createDashboard.useMutation({
    onSuccess: (newDashboard) => {
      toast.success('儀表板已建立');
      setActiveDashboardId(newDashboard.id);
      refetchDashboard();
    },
    onError: (err) => toast.error(`建立失敗: ${err.message}`),
  });

    useEffect(() => {
      if (!activeDashboardId && dashboards.length > 0) {
        setActiveDashboardId(dashboards[0].id);
      }
    }, [dashboards, activeDashboardId]);

  const widgets = useMemo(() => {
    if (!dashboardConfig?.widgets) return [];
    return (dashboardConfig.widgets as WidgetRaw[]).map((w) => ({
      id: w.id,
      metricKey: w.metricKey,
      layout: {
        i: w.id,
        x: (w.layout?.x as number) ?? 0,
        y: (w.layout?.y as number) ?? 0,
        w: (w.layout?.w as number) ?? 3,
        h: (w.layout?.h as number) ?? 2,
      } as DashboardWidgetLayout,
    }));
  }, [dashboardConfig]);

  // ✅ 修正重點：Layout 本身就是 LayoutItem[]，不要再加 []
const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      // ⛔ 跳過首次掛載時的自動觸發
      if (isInitialLayout) {
        setIsInitialLayout(false);
        return;
      }
      if (!dashboardConfig) return;

      // ✅ 關鍵：比對 layout 是否有實質改變
      const hasChanged = widgets.some((w) => {
        const found = newLayout.find((l) => l.i === w.id);
        if (!found) return true; // 找不到（不該發生）
        return (
          found.x !== w.layout.x ||
          found.y !== w.layout.y ||
          found.w !== w.layout.w ||
          found.h !== w.layout.h
        );
      });

      // 如果 layout 沒變（例如只是 refetch 後重新渲染），跳過 mutation
      if (!hasChanged) return;

      // 真的有變動才儲存
      const updatedWidgets = widgets.map((w) => {
        const found = newLayout.find((l) => l.i === w.id);
        return found
          ? {
              ...w,
              layout: {
                i: w.id,
                x: found.x,
                y: found.y,
                w: found.w,
                h: found.h,
              } as DashboardWidgetLayout,
            }
          : w;
      });

      saveLayoutMutation.mutate({
        widgets: updatedWidgets.map((w) => ({
          id: w.id,
          metricKey: w.metricKey,
          position: 0,
          layout: w.layout,
        })),
      });
    },
    [dashboardConfig, widgets, saveLayoutMutation, isInitialLayout],
);


const addWidget = useCallback(
  (metricKey: string) => {
    if (!dashboardConfig) return;
    saveLayoutMutation.mutate(
      {
        widgets: [
          // 更新現有 widget，使用原 layout
          ...widgets.map((w) => ({
            id: w.id,
            metricKey: w.metricKey,
            position: 0,
            layout: w.layout,
          })),
          // 新增 widget：構造完整 layout 物件
          {
            metricKey,
            position: widgets.length,
            layout: { x: 0, y: 0, w: 3, h: 2 },
          },
        ],
      },
      { onSuccess: () => setShowMetricPanel(false) },
    );
  },
  [dashboardConfig, widgets, saveLayoutMutation],
);

const removeWidget = useCallback(
  (widgetId: string) => {
    if (!dashboardConfig) return;
    const filtered = widgets.filter((w) => w.id !== widgetId);
    saveLayoutMutation.mutate({
      widgets: filtered.map((w, index) => ({
        id: w.id,
        metricKey: w.metricKey,
        position: index,             // ← 用 index 重新排序
        layout: w.layout,
      })),
    });
  },
  [dashboardConfig, widgets, saveLayoutMutation],
);


  const handleDashboardChange = useCallback((newId: string) => {
    setActiveDashboardId(newId);
    setShowMetricPanel(false);
  }, []);

if (!dashboards || dashboards.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-gray-500">尚未建立任何儀表板</p>
      <button
          onClick={() => {
    // 檢查是否已經有名為「我的儀表板」的儀表板
    const existing = dashboards.find(d => d.name === '我的儀表板');
    if (existing) {
      setActiveDashboardId(existing.id);  // 直接切換過去
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


  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <AdminDashboardSettings
          dashboards={dashboards}
          activeId={activeDashboardId ?? ''}
          onSelect={handleDashboardChange}
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
              onRemove={removeWidget}
            />
          )}
        </div>
      </div>
    </div>
  );
}
