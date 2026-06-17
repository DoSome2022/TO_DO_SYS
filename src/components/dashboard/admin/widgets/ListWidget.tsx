import type { MetricDefinition } from '@/types/dashboard-metrics';

interface ListItem {
  label: string;
  value: string | number;
}

interface ListWidgetProps {
  data: ListItem[] | null;
  metricConfig: MetricDefinition;
}

export function ListWidget({ data }: ListWidgetProps) {
  // 🔥 改為 Array.isArray 檢查，確保 data 真的是陣列
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-400 text-sm p-2">暫無列表數據</div>;
  }
  
  return (
    <ul className="divide-y divide-gray-100">
      {data.map((item, idx) => (
        <li key={idx} className="flex justify-between py-1.5 px-1 text-sm">
          <span className="text-gray-600 truncate">{item.label}</span>
          <span className="font-medium ml-2">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
