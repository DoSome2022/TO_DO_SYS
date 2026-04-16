"use client";

import { useState } from "react";
import { trpc } from "../../../../../trpc/client";
import { ListTodo, Plus, Loader2, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

export default function ProjectWorkItems({ projectId }: { projectId: string }) {
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // 1. 抓取專案資料
  const { data: project, refetch } = trpc.project.getProject.useQuery({ id: projectId });

  // 2. ★ 改用 addProjectTask
  const createMutation = trpc.project.addProjectTask.useMutation({
    onSuccess: () => {
      setNewTaskTitle("");
      refetch();
      toast.success("已新增工作項目");
    },
    onError: (err) => toast.error(err.message)
  });

  // 3. ★ 改用 assignProjectTask
  const assignMutation = trpc.project.assignProjectTask.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("指派成功");
    },
    onError: (err) => toast.error(err.message)
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createMutation.mutate({ projectId, title: newTaskTitle });
  };

  const handleAssignChange = (workItemId: string, staffId: string) => {
    assignMutation.mutate({ 
      workItemId, 
      staffId: staffId === "" ? null : staffId 
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <div className="p-4 border-b bg-gray-50 rounded-t-md flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-indigo-600" />
          工作內容與指派
        </h3>
      </div>

      <div className="p-4">
        {/* 新增工作表單 */}
        <form onSubmit={handleCreateTask} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="輸入新工作內容 (例如：設計首頁 Banner)..."
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim() || createMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm flex items-center gap-1 transition-colors"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            新增
          </button>
        </form>

        {/* 工作列表 */}
        <div className="space-y-3">
          {project?.workItems?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded border border-dashed">
              目前尚無工作項目，請從上方新增。
            </p>
          ) : (
            project?.workItems?.map((task) => (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-md hover:border-blue-300 transition-colors bg-white gap-3">
                
                {/* 左側：狀態與標題 */}
                <div className="flex items-center gap-3">
                  {task.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  )}
                  <span className={`font-medium ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {task.title}
                  </span>
                </div>

                {/* 右側：指派員工下拉選單 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">負責人:</span>
                  <select
                    value={task.staff?.id || ""} 
                    onChange={(e) => handleAssignChange(task.id, e.target.value)}
                    disabled={assignMutation.isPending}
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none min-w-[120px]"
                  >
                    <option value="">未指派</option>
                    {/* 只允許指派給「已經加入此專案」的員工 */}
                    {project?.users?.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
