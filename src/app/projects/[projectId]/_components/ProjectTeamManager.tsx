// app/projects/[projectId]/_components/ProjectTeamManager.tsx
"use client";

import { useState } from "react";
import { trpc } from "../../../../../trpc/client";
import { Users, UserPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectTeamManager({ projectId }: { projectId: string }) {
  const [selectedUserId, setSelectedUserId] = useState("");

  // 1. 抓取專案資訊 (包含目前成員)
  const { data: project, refetch: refetchProject } = trpc.project.getProject.useQuery({ 
    id: projectId 
  });
  
  // 2. ★ 修改：改用專門給 PM 指派的員工清單（只包含 STAFF）
  const { data: assignableStaff = [] } = trpc.user.getAssignableStaff.useQuery();

  // 3. 綁定員工 Mutation
  const assignMutation = trpc.project.assignUserToProject.useMutation({
    onSuccess: () => {
      toast.success("已成功指派員工到專案");
      setSelectedUserId("");
      refetchProject();
    },
    onError: (err) => toast.error(`指派失敗: ${err.message}`),
  });

  // 4. 解除綁定 Mutation
  const removeMutation = trpc.project.removeUserFromProject.useMutation({
    onSuccess: () => {
      toast.success("已成功移除員工");
      refetchProject();
    },
    onError: (err) => toast.error(`移除失敗: ${err.message}`),
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

  // 過濾掉已經在專案內的員工
  const availableUsers = assignableStaff.filter(
    user => !project?.users?.some(assigned => assigned.id === user.id)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <div className="p-4 border-b bg-gray-50 rounded-t-md flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          參與員工
        </h3>
        <span className="text-xs text-gray-500">僅可指派一般員工 (STAFF)</span>
      </div>

      <div className="p-4 space-y-4">
        {/* 指派新員工區塊 */}
        <div className="flex gap-2">
          <select 
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={assignMutation.isPending}
          >
            <option value="">選擇要指派的員工...</option>
            {availableUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} 
                {user.position?.name && ` (${user.position.name})`}
                {user.email && ` — ${user.email}`}
              </option>
            ))}
          </select>

          <button 
            onClick={handleAssign}
            disabled={!selectedUserId || assignMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-1 transition-colors text-sm whitespace-nowrap"
          >
            {assignMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            指派
          </button>
        </div>

        {/* 目前專案成員列表 */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 tracking-widest">
            目前專案成員 ({project?.users?.length || 0})
          </h4>

          {project?.users?.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">目前尚無指派任何員工</p>
          ) : (
            <ul className="space-y-2">
              {project?.users?.map((user: any) => {
                const displayName = user.name || "未知使用者";
                const displayEmail = user.email || "無信箱";
                const initial = displayName.charAt(0).toUpperCase();

                return (
                  <li 
                    key={user.id} 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 border border-gray-100 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-lg">
                        {initial}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{displayName}</p>
                        <p className="text-xs text-gray-500">
                          {user.position?.name || "員工"} • {displayEmail}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleRemove(user.id)}
                      className="text-gray-400 hover:text-red-600 p-2 transition-colors"
                      title="移除此員工"
                    >
                      <X className="w-5 h-5" />
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