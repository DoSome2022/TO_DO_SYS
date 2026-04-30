import type { MetricDefinition } from '@/types/dashboard-metrics';

interface PercentageWidgetProps {
  data: { percentage: number } | null;
  metricConfig: MetricDefinition;
}

export function PercentageWidget({ data }: PercentageWidgetProps) {
  const pct = data?.percentage ?? 0;
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <span className="text-4xl font-bold text-gray-800">
        {pct.toFixed(1)}%
      </span>
      <div className="w-full max-w-[80%] mt-2 bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
