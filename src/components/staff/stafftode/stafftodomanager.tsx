
"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Plus, Calendar, Trash2, Pencil, Briefcase, Wrench, Package, ChevronDown, ChevronUp, DollarSign } from "lucide-react";

import { format } from "date-fns";
import { toast } from "sonner";

import { trpc } from "../../../../trpc/client";
import { StaffTodoFormDialog } from "./stafftodoformdialog";
import { EquipmentCheckoutDialog } from "@/components/equipment/equipmentCheckoutDialog";
import { useUserProfile } from "../../../../hooks/useUserProfile";


export default function StaffTodoManager() {
  const { data: profile } = useUserProfile();
  const { data: todos, isLoading, isError } = trpc.todo.getMyTasks.useQuery();
  const utils = trpc.useUtils();

  // 表單狀態
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<any>(null);

  // ✅ 設備借用對話框狀態 (參考 WorkItemsViewer 的寫法)
  const [eqDialogOpen, setEqDialogOpen] = useState(false);
  const [activeTaskForEq, setActiveTaskForEq] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // ✅ 展開設備記錄的狀態
  const [expandedEquipmentLogs, setExpandedEquipmentLogs] = useState<string[]>([]);

  // Mutations
  const toggleMutation = trpc.todo.toggleStaffTodo.useMutation({
    onSuccess: () => utils.todo.getMyTasks.invalidate(),
  });
  
  const deleteMutation = trpc.todo.deleteToDo_Staff.useMutation({
    onSuccess: () => {
      toast.success("已刪除任務");
      utils.todo.getMyTasks.invalidate();
    },
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">載入個人任務中...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">載入失敗，請確認登入狀態。</div>;

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id, completed: !currentStatus });
  };

  const handleEdit = (todo: any) => {
    setEditingTodo({
      id: todo.id,
      title: todo.Title || "",
      targetDate: todo.targetDate ? new Date(todo.targetDate).toISOString().split('T')[0] : "",
    });
    setIsDialogOpen(true);
  };

  // ✅ 開啟設備借用對話框
  const handleOpenEqDialog = (todo: any) => {
    setActiveTaskForEq({
      id: todo.id,
      title: todo.Title,
    });
    setEqDialogOpen(true);
  };

  // ✅ 設備借用成功後
  const handleEquipmentCheckoutSuccess = () => {
    setEqDialogOpen(false);
    setActiveTaskForEq(null);
    utils.todo.getMyTasks.invalidate(); // 刷新列表
    toast.success("設備借用登記成功！");
  };

  // ✅ 展開/收合設備記錄
  const toggleEquipmentLogExpand = (logId: string) => {
    setExpandedEquipmentLogs((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]
    );
  };

  console.log(" Data : ", todos , "-- End --"); // 🔍 檢查後端回傳的資料結構，確認是否有 equipmentLogs

  return (
    <div className="max-w-3xl mx-auto my-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#eff6fc] px-6 py-5 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#005fb8] flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> 我的待辦清單 (My Tasks)
          </h2>
          <p className="text-sm text-gray-500 mt-1">管理您個人的工作項目與期限</p>
        </div>
        <button 
          onClick={() => { setEditingTodo(null); setIsDialogOpen(true); }}
          className="flex items-center gap-1.5 bg-[#005fb8] hover:bg-[#004e98] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> 新增任務
        </button>
      </div>

      {/* Task List */}
      <div className="p-2">
        {todos?.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>太棒了！目前沒有任何待辦事項。</p>
          </div>
        ) : (
          <div className="space-y-1">
            {todos?.map((todo) => {
              // ✅ 檢查是否有設備借用記錄 (需後端 todo router 有 include equipmentLogs)
              const hasEquipmentLogs = (todo as any).equipmentLogs?.length > 0;

              return (
                <div key={todo.id}>
                  {/* 主要任務卡片 */}
                  <div 
                    className={`group flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 ${todo.completed ? 'opacity-60' : ''}`}
                  >
                    {/* 左側：打勾按鈕 */}
                    <button 
                      onClick={() => handleToggle(todo.id, !!todo.completed)}
                      disabled={toggleMutation.isPending}
                      className="mr-4 text-gray-400 hover:text-[#005fb8] transition-colors focus:outline-none"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-[#107c10]" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>

                    {/* 中間：標題與資訊 */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-medium truncate ${todo.completed ? "text-gray-500 line-through" : "text-gray-900"}`}>
                        {todo.Title}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {todo.targetDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(todo.targetDate), 'yyyy-MM-dd')}
                          </span>
                        )}
                        {todo.PM_TODO && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                            所屬專案: {todo.PM_TODO.Title}
                          </span>
                        )}
                        {/* ✅ 顯示設備數量 */}
                        {hasEquipmentLogs && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {(todo as any).equipmentLogs.length} 項設備
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 右側：操作按鈕 (Hover 時顯示) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                      {/* ✅ 新增：設備借用按鈕 (只有未完成的任務可以借) */}
                      {!todo.completed && (
                        <button 
                          onClick={() => handleOpenEqDialog(todo)}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                          title="借用設備"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit(todo)}
                        className="p-2 text-gray-400 hover:text-[#005fb8] hover:bg-blue-50 rounded"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if(confirm("確定要刪除這筆個人任務嗎？")) deleteMutation.mutate({ id: todo.id });
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* ✅ 新增：已借用設備清單 (展開顯示) */}
                  {hasEquipmentLogs && (
                    <div className="ml-12 mr-4 mb-2 border rounded-md bg-gray-50 p-3">
                      <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        已借用設備 ({(todo as any).equipmentLogs.length})
                      </div>
                      
                      <div className="space-y-1.5">
                        {(todo as any).equipmentLogs.map((log: any) => {
                          const isExpanded = expandedEquipmentLogs.includes(log.id);
                          const isReturned = !!log.returnedAt;

                          return (
                            <div key={log.id} className="bg-white rounded border p-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${isReturned ? 'bg-green-500' : 'bg-amber-500'}`} />
                                  <span className="text-sm font-medium">
                                    {log.equipment?.name || '未知設備'}
                                  </span>
                                  {log.equipment?.billingType !== 'NONE' && log.equipment?.price > 0 && (
                                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                                      <DollarSign className="w-2.5 h-2.5 inline" />
                                      ${log.equipment.price}/{log.equipment.billingType === 'HOURLY' ? 'hr' : 'day'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400">
                                  {format(new Date(log.borrowedAt), 'MM/dd')}
                                  {isReturned && `→${format(new Date(log.returnedAt), 'MM/dd')}`}
                                </span>
                              </div>
                              {isReturned && log.totalCost != null && (
                                <div className="text-[10px] text-gray-400 mt-1 ml-4">
                                  費用: ${Number(log.totalCost).toFixed(2)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StaffTodoFormDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        initialData={editingTodo} 
      />

      {/* ✅ 新增：EquipmentCheckoutDialog */}
      {activeTaskForEq && profile?.id && (
        <EquipmentCheckoutDialog
          isOpen={eqDialogOpen}
          onClose={() => setEqDialogOpen(false)}
          onSuccess={handleEquipmentCheckoutSuccess}
          workItemTitle={activeTaskForEq.title}
          userId={profile.id}
          taskId={activeTaskForEq.id}
        />
      )}
    </div>
  );
}
