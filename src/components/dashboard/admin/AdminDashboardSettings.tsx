'use client';

import { api } from '@/utils/api';
import { useState } from 'react';
import toast from 'react-hot-toast'; 


interface DashboardBrief {
  id: string;        // ← 改為 string
  name: string;
}
interface AdminDashboardSettingsProps {
  dashboards: DashboardBrief[];
  activeId: string;  // ← 改為 string
  onSelect: (dashboardId: string) => void;  // ← 改為 string
}


export function AdminDashboardSettings({
  dashboards,
  activeId,
  onSelect,
}: AdminDashboardSettingsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');

  const utils = api.useUtils();
  const createMutation = api.adminDashboard.createDashboard.useMutation({
    onSuccess: () => {
      toast.success('仪表板已创建');
      setShowCreateDialog(false);
      setNewName('');
      utils.adminDashboard.getAllDashboardConfigs.refetch();
    },
    onError: (err) => toast.error(`创建失败: ${err.message}`),
  });

  const deleteMutation = api.adminDashboard.deleteDashboard.useMutation({
    onSuccess: () => {
      toast.success('仪表板已删除');
      utils.adminDashboard.getAllDashboardConfigs.refetch();
      // 如果删除的是当前激活的，切换至第一个
    },
    onError: (err) => toast.error(`删除失败: ${err.message}`),
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`确定删除仪表板「${name}」？此操作不可撤销。`)) {
      deleteMutation.mutate({ dashboardId: id });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 仪表板 tab 列表 */}
      {dashboards.map((d) => (
        <div
          key={d.id}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm cursor-pointer
            ${
              activeId === d.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          onClick={() => onSelect(d.id)}
        >
          <span>{d.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(d.id, d.name);
            }}
            className="ml-1 hover:text-red-400"
            title="删除此仪表板"
          >
            ✕
          </button>
        </div>
      ))}

      {/* 创建按钮 */}
      <button
        onClick={() => setShowCreateDialog(true)}
        className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
      >
        + 新建
      </button>

      {/* 新建对话框（简易） */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCreateDialog(false)}>
          <div
            className="bg-white rounded-lg p-4 w-80 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3">新建仪表板</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="仪表板名称"
              className="w-full border rounded px-2 py-1.5 text-sm mb-3"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={() => newName.trim() && createMutation.mutate({ name: newName.trim() })}
                disabled={!newName.trim() || createMutation.isPending}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
