// 'use client';

// import { XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
// import { api } from '@/utils/api';
// import { DASHBOARD_METRICS } from '@/lib/dashboard/metrics';
// import type { MetricDefinition } from '@/types/dashboard-metrics';

// // import { NumberWidget } from './widgets/NumberWidget';
// import { RatioWidget } from './widgets/RatioWidget';
// import { PercentageWidget } from './widgets/PercentageWidget';
// import { ChartWidget } from './widgets/ChartWidget';
// import { ListWidget } from './widgets/ListWidget';
// import { TableWidget } from './widgets/TableWidget';
// import { NumberWidget } from './widgets/NumberWidet';
// import { WidgetWithLayout } from '@/types/dashboard';

// interface WidgetCardProps {
//   widget: WidgetWithLayout;
//   globalTimeRange: { start: Date; end: Date };
//   onRemove: () => void;
// }

// // displayType 對應到哪個渲染組件
// const componentMap: Record<string, React.FC<any>> = {
//   NUMBER: NumberWidget,
//   RATIO: RatioWidget,
//   PERCENTAGE: PercentageWidget,
//   CHART_BAR: ChartWidget,
//   CHART_PIE: ChartWidget,
//   CHART_LINE: ChartWidget,
//   LIST: ListWidget,
//   TABLE: TableWidget,
// };

// export function WidgetCard({ widget, globalTimeRange, onRemove }: WidgetCardProps) {
//   // 從 DASHBOARD_METRICS 陣列中找到對應的指標定義
//   const metricConfig = DASHBOARD_METRICS.find((m) => m.key === widget.metricKey) as
//     | MetricDefinition
//     | undefined;

//   const { data, isLoading, error } = api.adminDashboard.queryMetric.useQuery(
//     {
//       metricKey: widget.metricKey,
//       dateRange: {
//         start: globalTimeRange.start.toISOString(),
//         end: globalTimeRange.end.toISOString(),
//       },
//     },
//     { enabled: !!metricConfig },
//   );

//   if (!metricConfig) {
//     return (
//       <div className="p-4 text-red-500 text-sm">
//         未知指标: {widget.metricKey}
//       </div>
//     );
//   }

//   const DisplayComponent = componentMap[metricConfig.displayType];

//   return (
//     <div className="relative h-full flex flex-col">
//       {/* 拖拽手柄 + 标题 */}
//       <div className="drag-handle flex items-center justify-between px-3 py-2 bg-gray-50 border-b cursor-move">
//         <span className="text-sm font-semibold text-gray-700 truncate flex-1">
//           {metricConfig.label}
//         </span>
//         <div className="flex gap-1">
//           <button
//             onClick={onRemove}
//             className="p-1 hover:bg-gray-200 rounded text-gray-500"
//             title="移除"
//           >
//             <XMarkIcon className="w-4 h-4" />
//           </button>
//           <button
//             className="p-1 hover:bg-gray-200 rounded text-gray-500"
//             title="设置（待实现）"
//           >
//             <Cog6ToothIcon className="w-4 h-4" />
//           </button>
//         </div>
//       </div>
//       {/* 内容区域 */}
//       <div className="flex-1 p-3 overflow-auto">
//         {isLoading ? (
//           <div className="flex items-center justify-center h-full">
//             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
//           </div>
//         ) : error ? (
//           <div className="text-red-500 text-sm">{error.message}</div>
//         ) : DisplayComponent ? (
//           <DisplayComponent data={data} metricConfig={metricConfig} />
//         ) : (
//           <div className="text-gray-400 text-sm">
//             未实现 {metricConfig.displayType} 展示
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// src/components/dashboard/admin/widgeCard.tsx


'use client';

import { api } from '@/utils/api';
import { DASHBOARD_METRICS } from '@/lib/dashboard/metrics';
import type { MetricDefinition } from '@/types/dashboard-metrics';
import type { WidgetWithLayout } from '@/types/dashboard';

import { RatioWidget } from './widgets/RatioWidget';
import { PercentageWidget } from './widgets/PercentageWidget';
import { ChartWidget } from './widgets/ChartWidget';
import { ListWidget } from './widgets/ListWidget';
import { TableWidget } from './widgets/TableWidget';
import { NumberWidget } from './widgets/NumberWidet';


interface WidgetCardProps {
  widget: WidgetWithLayout;
  globalTimeRange: { start: Date; end: Date };
  onRemove: () => void;
}

const componentMap: Record<string, React.FC<any>> = {
  NUMBER: NumberWidget,
  RATIO: RatioWidget,
  PERCENTAGE: PercentageWidget,
  CHART_BAR: ChartWidget,
  CHART_PIE: ChartWidget,
  CHART_LINE: ChartWidget,
  LIST: ListWidget,
  TABLE: TableWidget,
};

export function WidgetCard({ widget, globalTimeRange, onRemove }: WidgetCardProps) {
  const metricConfig = DASHBOARD_METRICS.find(
    (m) => m.key === widget.metricKey,
  ) as MetricDefinition | undefined;



  const { data, isLoading, error } = api.adminDashboard.queryMetric.useQuery(
    {
      metricKey: widget.metricKey,
      dateRange: {
        start: globalTimeRange.start.toISOString(),
        end: globalTimeRange.end.toISOString(),
      },
    },
    { enabled: !!metricConfig },
  );

  if (!metricConfig) {
    return (
      <div className="p-4 text-red-500 text-sm">未知指標: {widget.metricKey}</div>
    );
  }

  const DisplayComponent = componentMap[metricConfig.displayType];

  return (
    <div className="relative h-full flex flex-col">
      <div className="drag-handle flex items-center justify-between px-3 py-2 bg-gray-50 border-b cursor-move">
        <span className="text-sm font-semibold text-gray-700 truncate flex-1">
          {metricConfig.label}
        </span>
        <div className="flex gap-1">
          <button
            onClick={onRemove}
            className="p-1 hover:bg-gray-200 rounded text-gray-500"
            title="移除"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button className="p-1 hover:bg-gray-200 rounded text-gray-500" title="設定">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error.message}</div>
        ) : DisplayComponent ? (
          <DisplayComponent data={data} metricConfig={metricConfig} />
        ) : (
          <div className="text-gray-400 text-sm">
            未實現 {metricConfig.displayType} 展示
          </div>
        )}
      </div>
    </div>
  );
}

