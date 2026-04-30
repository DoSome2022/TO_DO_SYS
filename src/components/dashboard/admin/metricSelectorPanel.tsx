'use client';

import { useState } from 'react';
import { DASHBOARD_METRICS } from '@/lib/dashboard/metrics';
import type { MetricDefinition } from '@/types/dashboard-metrics';

interface MetricSelectorPanelProps {
  onAdd: (metricKey: string) => void;
}

export function MetricSelectorPanel({ onAdd }: MetricSelectorPanelProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // 按分類分組
  const categories = DASHBOARD_METRICS.reduce(
    (acc: Record<string, MetricDefinition[]>, metric) => {
      const cat = metric.category || '其他';
      acc[cat] = acc[cat] || [];
      acc[cat].push(metric);
      return acc;
    },
    {},
  );

  const filteredCategories = Object.entries(categories).filter(([cat, metrics]) => {
    if (categoryFilter && cat !== categoryFilter) return false;
    if (search) {
      return metrics.some(
        (m) =>
          m.label.toLowerCase().includes(search.toLowerCase()) ||
          m.key.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return true;
  });

  return (
    <div className="bg-white border rounded-lg p-3 space-y-3 max-h-[70vh] overflow-y-auto">
      <h3 className="font-semibold text-sm text-gray-700">添加指标</h3>
      {/* 搜索框 */}
      <input
        type="text"
        placeholder="搜索指标..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm"
      />
      {/* 分類過濾 */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`px-2 py-0.5 text-xs rounded ${!categoryFilter ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
        >
          全部
        </button>
        {Object.keys(categories).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-2 py-0.5 text-xs rounded ${categoryFilter === cat ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      {/* 指標列表 */}
      <div className="space-y-2">
        {filteredCategories.map(([cat, metrics]) => (
          <div key={cat}>
            <h4 className="text-xs font-medium text-gray-500 mb-1">{cat}</h4>
            <div className="space-y-1">
              {(search
                ? metrics.filter(
                    (m) =>
                      m.label.toLowerCase().includes(search.toLowerCase()) ||
                      m.key.toLowerCase().includes(search.toLowerCase()),
                  )
                : metrics
              ).map((metric) => (
                <button
                  key={metric.key}
                  onClick={() => onAdd(metric.key)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-blue-50 text-sm flex justify-between items-center"
                >
                  <span className="truncate">{metric.label}</span>
                  <span className="text-xs text-gray-400 ml-2">{metric.displayType}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <p className="text-gray-400 text-sm">无匹配指标</p>
        )}
      </div>
    </div>
  );
}
