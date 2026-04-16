"use client";

import { useState, useEffect } from "react";
import { trpc } from "../../../trpc/client"; // 請確認路徑
import { useRouter } from "next/navigation";

// 定義表單接收的 Props，如果是編輯模式會傳入 initialData
type Props = {
  initialData?: {
    id: string;
    name: string;
    role: string;      // 注意這裡可能是 string
    positionId?: string | null;
  } | null;
  onSuccess?: () => void; // 成功後的回呼
  onCancel?: () => void;  // 取消後的回呼
};

export default function StaffForm({ initialData, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const isEditMode = !!initialData;

  // === 1. 表單狀態 ===
  const [name, setName] = useState("");
  const [role, setRole] = useState<"PM" | "STAFF">("STAFF");
  const [positionId, setPositionId] = useState("");

  // === 2. 載入職位資料 (給下拉選單用) ===
  const { data: positions } = trpc.user.getPositionsForDropdown.useQuery();

  // === 3. 初始化資料 (如果是編輯模式) ===
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRole((initialData.role as "PM" | "STAFF") || "STAFF");
      setPositionId(initialData.positionId || "");
    }
  }, [initialData]);

  // === 4. 根據選到的 positionId，找出對應的職位資料 (為了顯示權限) ===
  const selectedPositionData = positions?.find(p => p.id === positionId);

  // === 5. 設定 Mutations ===
  const utils = trpc.useUtils();
  
  const createUser = trpc.user.createUser.useMutation({
    onSuccess: () => {
      alert("員工建立成功！");
      utils.user.getStaffs.invalidate(); // 重新整理列表
      if (onSuccess) onSuccess();
      else router.push("/staff"); // 如果沒有 callback 就跳轉
    },
    onError: (err) => alert(err.message)
  });

  const updateUser = trpc.user.updateUser.useMutation({
    onSuccess: () => {
      alert("員工更新成功！");
      utils.user.getStaffs.invalidate();
      if (onSuccess) onSuccess();
      else router.push("/staff");
    },
    onError: (err) => alert(err.message)
  });

  // === 6. 送出表單 ===
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        name,
        role,
        positionId: positionId || undefined, // 空字串轉 undefined
    };

    if (isEditMode && initialData) {
      updateUser.mutate({ ...payload, id: initialData.id });
    } else {
      createUser.mutate(payload);
    }
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        {isEditMode ? "編輯員工資料" : "建立新員工"}
      </h2>

      <div className="space-y-4">
        
        {/* 1. 姓名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="請輸入員工姓名"
          />
        </div>

        {/* 2. 系統角色 (PM / STAFF) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">系統角色 (Role)</label>
          <div className="flex gap-4">
            <label className={`flex-1 border rounded-md p-3 cursor-pointer transition-colors ${role === 'STAFF' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                    <input 
                        type="radio" 
                        name="role" 
                        value="STAFF" 
                        checked={role === "STAFF"} 
                        onChange={() => setRole("STAFF")}
                        className="text-blue-600"
                    />
                    <div>
                        <span className="font-semibold block text-sm">STAFF</span>
                        <span className="text-xs text-gray-500">一般員工，受權限限制</span>
                    </div>
                </div>
            </label>

            <label className={`flex-1 border rounded-md p-3 cursor-pointer transition-colors ${role === 'PM' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                    <input 
                        type="radio" 
                        name="role" 
                        value="PM" 
                        checked={role === "PM"} 
                        onChange={() => setRole("PM")}
                        className="text-blue-600"
                    />
                    <div>
                        <span className="font-semibold block text-sm">PM</span>
                        <span className="text-xs text-gray-500">專案經理，擁有較高權限</span>
                    </div>
                </div>
            </label>
          </div>
        </div>

        {/* 3. 職位 (Position) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            職位 (Position)
          </label>
          <select
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">-- 請選擇職位 --</option>
            {positions?.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">選擇職位將自動帶入對應的權限。</p>
        </div>

        {/* 4. 權限 (Permission) - 唯讀展示 */}
        {/* 我們不做選單，而是顯示「選中職位」擁有的權限 */}
        <div className="bg-gray-50 p-3 rounded-md border border-dashed border-gray-300">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">
                此職位包含的權限 (Permissions)
            </label>
            
            {!positionId && (
                <span className="text-sm text-gray-400 italic">請先選擇職位以預覽權限</span>
            )}

            {positionId && selectedPositionData?.permissions.length === 0 && (
                <span className="text-sm text-amber-600">此職位尚未設定任何權限</span>
            )}

            <div className="flex flex-wrap gap-2">
                {selectedPositionData?.permissions.map((perm) => (
                    <span 
                        key={perm.id} 
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                    >
                        {perm.name}
                    </span>
                ))}
            </div>
        </div>

      </div>

      {/* 按鈕區 */}
      <div className="mt-8 flex justify-end gap-3">
        {onCancel && (
            <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
            取消
            </button>
        )}
        
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "處理中..." : isEditMode ? "儲存變更" : "建立員工"}
        </button>
      </div>
    </form>
  );
}
