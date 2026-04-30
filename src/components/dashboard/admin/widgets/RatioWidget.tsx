import type { MetricDefinition } from '@/types/dashboard-metrics';

interface RatioWidgetProps {
  data: { numerator: number; denominator: number } | null;
  metricConfig: MetricDefinition;
}

export function RatioWidget({ data }: RatioWidgetProps) {
  const num = data?.numerator ?? 0;
  const den = data?.denominator ?? 0;
  return (
    <div className="flex items-baseline justify-center gap-1 h-full">
      <span className="text-3xl font-bold text-gray-800">{num}</span>
      <span className="text-xl text-gray-500">/</span>
      <span className="text-3xl font-bold text-gray-800">{den}</span>
    </div>
  );
}
