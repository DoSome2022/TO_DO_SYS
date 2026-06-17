'use client';

import GridLayout from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import type { WidgetWithLayout } from '@/types/dashboard';
import { WidgetCard } from './WidgeCard';

interface WidgetGridProps {
  widgets: WidgetWithLayout[];
  globalTimeRange: { start: Date; end: Date };
  onLayoutChange: (layout: Layout) => void;
  // 🔥 新增：拖動結束時觸發
  onDragStop: (layout: Layout) => void;
  onRemove: (widgetId: string) => void;
}

export function WidgetGrid({
  widgets,
  globalTimeRange,
  onLayoutChange,
  onDragStop,     // 🔥 接收
  onRemove,
}: WidgetGridProps) {
  const layout: Layout = widgets.map((w) => ({
    i: w.id,
    x: w.layout.x,
    y: w.layout.y,
    w: w.layout.w,
    h: w.layout.h,
  }));

  const gridItems = widgets.map((w) => (
    <div key={w.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <WidgetCard
        widget={w}
        globalTimeRange={globalTimeRange}
        onRemove={() => onRemove(w.id)}
      />
    </div>
  ));

  return (
    <GridLayout
      className="layout"
      layout={layout}
      {...({
        cols: 12,
        rowHeight: 100,
        width: 1200,
      } as any)}
      draggableHandle=".drag-handle"
      onLayoutChange={onLayoutChange}
      // 🔥 新增：只在拖動結束時觸發
      onDragStop={(newLayout) => onDragStop(newLayout)}
    >
      {gridItems}
    </GridLayout>
  );
}
