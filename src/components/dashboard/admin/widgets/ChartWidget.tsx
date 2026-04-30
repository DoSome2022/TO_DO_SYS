'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
  ResponsiveContainer,
} from 'recharts';
import type { MetricDefinition } from '@/types/dashboard-metrics';

interface ChartData {
  labels: string[];
  values: number[];
}

interface ChartWidgetProps {
  data: ChartData | null;
  metricConfig: MetricDefinition;
  // displayType 可能是 'CHART_BAR' | 'CHART_PIE' | 'CHART_LINE'
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export function ChartWidget({ data, metricConfig }: ChartWidgetProps) {
const chartData = useMemo(() => {
  if (!data || !Array.isArray(data.labels) || !Array.isArray(data.values)) return [];
  return data.labels.map((label, i) => ({
    name: label,
    值: data.values[i] ?? 0,
  }));
}, [data]);

  if (!chartData.length) {
    return <div className="text-gray-400 text-center py-4">无数据</div>;
  }

  const chartType = metricConfig.displayType; // 如 'CHART_BAR', 'CHART_PIE', 'CHART_LINE'

  const renderChart = () => {
    switch (chartType) {
      case 'CHART_PIE':
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="值"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      case 'CHART_LINE':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="值" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        );
      case 'CHART_BAR':
      default:
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="值" fill="#3b82f6" />
          </BarChart>
        );
    }
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      {renderChart()}
    </ResponsiveContainer>
  );
}
