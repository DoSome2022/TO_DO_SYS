import type { MetricDefinition } from '@/types/dashboard-metrics';

interface NumberWidgetProps {
  data: { value: number } | null;
  metricConfig: MetricDefinition;
}

export function NumberWidget({ data }: NumberWidgetProps) {
  const displayValue = data?.value ?? 0;
  return (
    <div className="flex items-center justify-center h-full">
      <span className="text-4xl font-bold text-gray-800">
        {displayValue.toLocaleString()}
      </span>
    </div>
  );
}
