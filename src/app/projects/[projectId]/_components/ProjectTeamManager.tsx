// app/projects/[projectId]/_components/ProjectTeamManager.tsx
"use client";

import { useState } from "react";
import { trpc } from "../../../../../trpc/client";
import { Users, UserPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectTeamManager({ projectId }: { projectId: string }) {
  const [selectedUserId, setSelectedUserId] = useState("");

  // 1. 抓取專案資訊 (包含目前綁定的員工)
  const { data: project, refetch: refetchProject } = trpc.project.getProject.useQuery({ id: projectId });
  
  // 2. 抓取系統所有員工名單 (準備放進下拉選單)
  const { data: allUsers } = trpc.user.getAllStaff.useQuery();

  // 3. 綁定員工 Mutation
  const assignMutation = trpc.project.assignUserToProject.useMutation({
    onSuccess: () => {
      toast.success("已成功指派員工");
      setSelectedUserId(""); // 清空選擇
      refetchProject(); // 重新抓取專案資料更新畫面
    },
    onError: (err) => toast.error("指派失敗: " + err.message)
  });

  // 4. 解除綁定 Mutation
  const removeMutation = trpc.project.removeUserFromProject.useMutation({
    onSuccess: () => {
      toast.success("已移除員工");
      refetchProject();
    },
    onError: (err) => toast.error("移除失敗: " + err.message)
  });

  const handleAssign = () => {
    if (!selectedUserId) return;
    assignMutation.mutate({ projectId, userId: selectedUserId });
  };

  const handleRemove = (userId: string) => {
    if (confirm("確定要將此員工從專案中移除嗎？")) {
      removeMutation.mutate({ projectId, userId });
    }
  };

  // 過濾掉已經在專案內的員工，只顯示還沒加入的
  const availableUsers = allUsers?.filter(
    user => !project?.users?.some(assigned => assigned.id === user.id)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <div className="p-4 border-b bg-gray-50 rounded-t-md flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          參與員工
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* 指派新員工區塊 */}
        <div className="flex gap-2">
          <select 
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">選擇要指派的員工...</option>
            {availableUsers?.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <button 
            onClick={handleAssign}
            disabled={!selectedUserId || assignMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-3 py-2 rounded flex items-center gap-1 transition-colors text-sm"
          >
            {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            指派
          </button>
        </div>

        {/* 目前專案成員列表 */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">目前成員</h4>
          {project?.users?.length === 0 ? (
            <p className="text-sm text-gray-400">目前尚無指派員工</p>
          ) : (
            <ul className="space-y-2">
              {project?.users?.map(user => {
                // ★ 修改 2：先定義好安全的顯示名稱
                const displayName = user.name || "未知使用者";
                const displayEmail = user.email || "無信箱";
                // 安全地取得頭像的第一個字母
                const initial = displayName.charAt(0).toUpperCase();

                return (
                  <li key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 border rounded text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {/* ★ 修改 3：使用安全的字母 */}
                        {initial}
                      </div>
                      <div>
                        {/* ★ 修改 4：使用安全的名稱與信箱 */}
                        <p className="font-medium text-gray-800">{displayName}</p>
                        <p className="text-xs text-gray-500">{displayEmail}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemove(user.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="移除員工"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
