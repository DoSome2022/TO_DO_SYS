"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../../trpc/client";

// 1. 定義資料型別 (根據你的錯誤訊息推斷的結構)
type Permission = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  description: string | null;
};

type Feature = {
  id: string;
  title: string; // 注意：你的錯誤訊息顯示這裡是 title
  key: string;
};

// 這是編輯模式時傳入的舊資料結構
type PositionData = {
  id: string;
  name: string;
  description?: string | null;
  permissions: { id: string }[]; // 關聯資料通常是物件陣列
  features: { id: string }[];
};

// 2. 定義元件接受的 Props
interface StaffPositionFormProps {
  initialPermissions: Permission[]; // 必填：所有可選權限
  initialFeatures: Feature[];     // 必填：所有可選功能
  initialData?: PositionData;     // 選填：只有在編輯模式時才會有
}

export default function StaffPositionForm({ 
  initialPermissions, 
  initialFeatures, 
  initialData 
}: StaffPositionFormProps) {
  
  const router = useRouter();
  const utils = trpc.useUtils();
  const isEditMode = !!initialData; // 是否為編輯模式

  // 3. 初始化表單狀態 (如果有 initialData 就用它的值，否則用空值)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    // 將物件陣列轉換為 ID 陣列
    permissions: initialData?.permissions.map(p => p.id) || ([] as string[]),
    features: initialData?.features.map(f => f.id) || ([] as string[]),
  });

  // 4. 定義 Mutation
  // 新增用的
  const createMutation = trpc.staffPosition.createStaffPosition.useMutation({
    onSuccess: () => {
      utils.staffPosition.getAllstaffPosition.invalidate();
      router.push("/admin/positions");
      router.refresh();
    },
    onError: (err) => alert("建立失敗: " + err.message),
  });

  // 更新用的 (假設你的後端有這個 router，請根據實際名稱修改)
  const updateMutation = trpc.staffPosition.updateStaffPosition.useMutation({
    onSuccess: () => {
      utils.staffPosition.getAllstaffPosition.invalidate();
      // 如果是在詳細頁編輯，可能要 refresh 或回到列表
      router.push("/admin/positions"); 
      router.refresh();
    },
    onError: (err) => alert("更新失敗: " + err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("請輸入職位名稱");

    const payload = {
      name: formData.name,
      description: formData.description,
      permissionIds: formData.permissions,
      featureIds: formData.features,
    };

    if (isEditMode && initialData) {
      // 編輯模式：記得傳入 ID
      updateMutation.mutate({
        id: initialData.id,
        ...payload
      });
    } else {
      // 新增模式
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-6 text-gray-800">
        {isEditMode ? "編輯職位" : "建立新職位"}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 職位名稱 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            職位名稱 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="例如：店長"
            required
          />
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            職位描述
          </label>
          <textarea
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
          />
        </div>

        {/* 權限選擇區塊 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">分配權限</label>
          <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {initialPermissions
                ?.filter(p => p.isActive)
                .map((permission) => {
                  const isSelected = formData.permissions.includes(permission.id);
                  return (
                    <div
                      key={permission.id}
                      onClick={() => {
                        setFormData(prev => {
                          const newPerms = isSelected
                            ? prev.permissions.filter(id => id !== permission.id)
                            : [...prev.permissions, permission.id];
                          return { ...prev, permissions: newPerms };
                        });
                      }}
                      className={`cursor-pointer border rounded p-3 flex items-center gap-3 transition-colors ${
                        isSelected ? "bg-blue-50 border-blue-500" : "bg-white border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{permission.name}</div>
                        <div className="text-xs text-gray-500">{permission.code}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 功能選擇區塊 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">可用功能</label>
          <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {initialFeatures?.map((feature) => {
                  const isSelected = formData.features.includes(feature.id);
                  return (
                    <div
                      key={feature.id}
                      onClick={() => {
                        setFormData(prev => {
                          const newFeats = isSelected
                            ? prev.features.filter(id => id !== feature.id)
                            : [...prev.features, feature.id];
                          return { ...prev, features: newFeats };
                        });
                      }}
                      className={`cursor-pointer border rounded p-3 flex items-center gap-3 transition-colors ${
                        isSelected ? "bg-green-50 border-green-500" : "bg-white border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected ? "bg-green-600 border-green-600" : "border-gray-300 bg-white"
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className="text-sm font-medium">{feature.title}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 按鈕區 */}
        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
          >
            {isSubmitting ? "處理中..." : (isEditMode ? "儲存修改" : "確認建立")}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
