"use client";

import { useState } from "react";
import { trpc } from "../../../trpc/client";


type Props = {
  onSuccess?: () => void;
};

export default function CreatePermissionForm({ onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.staffPermission.createPermission.useMutation({
    onSuccess: () => {
      alert("權限建立成功！");
      setFormData({ name: "", code: "", description: "" }); // 清空表單
      utils.staffPermission.getAll.invalidate(); // 重新整理列表
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      alert("建立失敗：" + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800">新增權限 (Permission)</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 權限名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">權限名稱 (Name)</label>
            <input
              type="text"
              required
              placeholder="例如：查看儀表板"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* 權限代碼 (Code) - 通常是用英文大寫 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">權限代碼 (Code)</label>
            <input
              type="text"
              required
              placeholder="例如：VIEW_DASHBOARD"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} // 自動轉大寫
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">建議使用大寫英文與底線，且必須唯一。</p>
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述 (Description)</label>
          <textarea
            required
            placeholder="說明此權限的用途..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none h-20"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? "建立中..." : "新增權限"}
          </button>
        </div>
      </form>
    </div>
  );
}
