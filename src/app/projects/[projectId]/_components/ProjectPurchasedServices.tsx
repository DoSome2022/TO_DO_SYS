"use client";

import { useState } from "react";
import { trpc } from "../../../../../trpc/client";
import { Briefcase, FileText, CheckSquare, Loader2, Check, X, User } from "lucide-react";
import { toast } from "sonner";

export default function ProjectPurchasedServices({ projectId }: { projectId: string }) {
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const { data: project, isLoading, refetch } = trpc.project.getProject.useQuery({ id: projectId });

  const createTaskMutation = trpc.project.addProjectTask.useMutation();
  const assignTaskMutation = trpc.project.assignProjectTask.useMutation();

  if (isLoading) return <div className="p-4 text-sm text-gray-500">載入工作內容中...</div>;

  const quoteItems = project?.quotation?.items || [];
  const projectUsers = project?.users || []; 
  const currentWorkItems = project?.workItems || [];

  // ★ 點擊指派/重新指派按鈕時，如果有原本的員工 ID，就先預填進去
  const handleAssignClick = (itemId: string, currentStaffId?: string) => {
    setAssigningItemId(itemId);
    setSelectedStaffId(currentStaffId || ""); 
  };

  // ★ 送出指派 (新增了 existingTaskId 參數，用來判斷是「新建」還是「更新」)
  const handleConfirmAssign = async (taskTitle: string, existingTaskId?: string) => {
    if (!selectedStaffId) {
      toast.error("請先選擇要指派的員工");
      return;
    }
    
    try {
      let targetWorkItemId = existingTaskId;

      // 如果這個任務還沒在 WorkItem 表裡面建立過，才呼叫 Create
      if (!targetWorkItemId) {
        const newTask = await createTaskMutation.mutateAsync({ projectId, title: taskTitle });
        targetWorkItemId = newTask.id;
      }

      // 呼叫 Assign 把員工綁定上去 (無論是新建還是舊的都適用)
      await assignTaskMutation.mutateAsync({ 
        workItemId: targetWorkItemId, 
        staffId: selectedStaffId 
      });
      
      toast.success(existingTaskId ? `已重新指派「${taskTitle}」！` : `成功將「${taskTitle}」轉為任務並指派！`);
      setAssigningItemId(null);
      refetch();
    } catch (error: any) {
      toast.error("指派失敗：" + error.message);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <div className="p-4 border-b bg-indigo-50/50 rounded-t-md flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          專案工作內容 (基於報價單)
        </h3>
        {project?.quotation && (
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-200 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            報價單: {project.quotation.title}
          </span>
        )}
      </div>

      <div className="p-4">
        {quoteItems.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded border border-dashed">
            此專案目前沒有綁定報價單服務項目。
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 mb-2">以下是客戶購買的服務清單，也是本專案必須完成的工作範圍：</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quoteItems.map((item) => {
                const taskTitle = item.customName || item.service?.name || "未命名服務";
                
                // 找找看有沒有對應的 WorkItem
                const assignedTask = currentWorkItems.find(w => w.title === taskTitle);
                const hasTask = !!assignedTask;
                const isAssigned = hasTask && !!assignedTask.staff;
                const assigneeName = assignedTask?.staff?.name || "未指派";
                const isCompleted = assignedTask?.isCompleted || false;

                return (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <CheckSquare className={`w-4 h-4 ${isCompleted ? 'text-gray-400' : 'text-green-500'}`} />
                        <span className={isCompleted ? 'text-gray-400 line-through' : ''}>
                          {taskTitle}
                        </span>
                      </h4>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        數量: {item.quantity}
                      </span>
                    </div>
                    
                    {item.service?.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                        {item.service.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t pt-2 mt-2 min-h-[36px]">
                      <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">
                        類別: {item.service?.type || '一般'}
                      </span>
                      
                      {assigningItemId === item.id ? (
                        // ★ 狀態 1：展開下拉選單中
                        <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                          {projectUsers.length === 0 ? (
                            <span className="text-[11px] text-red-500">請先於右側加入員工</span>
                          ) : (
                            <select
                              value={selectedStaffId}
                              onChange={(e) => setSelectedStaffId(e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-indigo-500 bg-white"
                            >
                              <option value="">-- 選擇員工 --</option>
                              {projectUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          )}

                          <button
                            // 把 existingTaskId 傳進去，避免重複新增任務
                            onClick={() => handleConfirmAssign(taskTitle, assignedTask?.id)}
                            disabled={createTaskMutation.isPending || assignTaskMutation.isPending}
                            className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors disabled:opacity-50"
                          >
                            {createTaskMutation.isPending || assignTaskMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => setAssigningItemId(null)}
                            className="text-gray-400 hover:bg-gray-100 p-1 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        // ★ 狀態 2：未展開下拉選單 (按鈕化)
                        <button 
                          // 點擊時，把原本的員工 ID 傳過去當作預設值
                          onClick={() => handleAssignClick(item.id, assignedTask?.staff?.id)}
                          className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                            isAssigned 
                              ? (isCompleted ? 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200')
                              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800'
                          }`}
                        >
                          {isAssigned ? (
                            <>
                              <User className="w-3 h-3" />
                              {assigneeName} {isCompleted ? '(已完成)' : '(進行中)'}
                            </>
                          ) : (
                            "+ 轉為任務並指派"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
