"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Plus, Calendar, Trash2, Pencil, Briefcase } from "lucide-react";

import { format } from "date-fns";
import { toast } from "sonner";

import { trpc } from "../../../../trpc/client";
import { StaffTodoFormDialog } from "./stafftodoformdialog";

export default function StaffTodoManager() {
  const { data: todos, isLoading, isError } = trpc.todo.getMyTasks.useQuery();
  const utils = trpc.useUtils();

  // 表單狀態
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<any>(null);

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
            {todos?.map((todo) => (
              <div 
                key={todo.id} 
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
                  </div>
                </div>

                {/* 右側：操作按鈕 (Hover 時顯示) */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
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
            ))}
          </div>
        )}
      </div>

      <StaffTodoFormDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        initialData={editingTodo} 
      />
    </div>
  );
}
