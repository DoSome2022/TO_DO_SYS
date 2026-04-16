// app/staff/permission/page.tsx

"use client";

import CreatePermissionForm from "@/components/permission/create-permission-form";
import { trpc } from "../../../../trpc/client";

export default function PermissionPage() {
  const utils = trpc.useUtils();
  const { data: permissions, isLoading } = trpc.staffPermission.getAll.useQuery();

  // 切換狀態的 Mutation
  const toggleMutation = trpc.staffPermission.toggleStatus.useMutation({
    onSuccess: () => utils.staffPermission.getAll.invalidate(),
  });

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id, isActive: !currentStatus });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">權限管理系統</h1>
      <CreatePermissionForm />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {!isLoading && permissions?.map((perm) => (
          <div 
            key={perm.id} 
            className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${
                perm.isActive ? "bg-white border-gray-200" : "bg-gray-100 border-gray-300 opacity-75"
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-bold text-lg ${perm.isActive ? "text-gray-800" : "text-gray-500 line-through"}`}>
                    {perm.name}
                </h3>
                {/* 狀態標籤 */}
                <span className={`text-xs font-mono px-2 py-1 rounded ${
                    perm.isActive ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-500"
                }`}>
                  {perm.code}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{perm.description}</p>
            </div>
            
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400">狀態: {perm.isActive ? "啟用" : "已禁用"}</span>
              
              {/* 切換按鈕 */}
              <button
                onClick={() => handleToggle(perm.id, perm.isActive)}
                disabled={toggleMutation.isPending}
                className={`px-3 py-1 text-xs rounded text-white transition ${
                    perm.isActive 
                    ? "bg-red-500 hover:bg-red-600" 
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {perm.isActive ? "禁用" : "啟用"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
