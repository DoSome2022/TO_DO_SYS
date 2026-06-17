import type { MetricDefinition } from '@/types/dashboard-metrics';

interface TableColumn {
  key: string;
  label: string;
}

interface TableRow {
  [key: string]: string | number;
}

// interface TableWidgetProps {
//   data: { columns: TableColumn[]; rows: TableRow[] } | null;
//   metricConfig: MetricDefinition;
// }

interface TableWidgetProps {
  data: {
    columns: { key: string; label: string }[];
    rows: Record<string, any>[];
  } | null;
}


export function TableWidget({ data }: TableWidgetProps) {
  if (!data || data.rows.length === 0) {
    return <div className="text-gray-400 text-sm p-2">暂无表格数据</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead>
          <tr className="border-b bg-gray-50">
            {data.columns.map((col) => (
              <th key={col.key} className="px-2 py-1 font-medium text-gray-600">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, idx) => (
            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
              {data.columns.map((col) => (
                <td key={col.key} className="px-2 py-1 text-gray-700">
                  {row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
