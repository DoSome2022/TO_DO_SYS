"use client";

import { CheckCircle2, Circle, Paperclip, User, X, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge"; 

import { toast } from "sonner"; // 你 package.json 有安裝 sonner
import { trpc } from "../../../../trpc/client";

type StaffTodo = {
  id: string;
  Title: string;
  completed: boolean;
  staff: { name: string | null } | null;
};

type PmTodoDetailProps = {
  task: any; 
  onClose: () => void;
  onEdit: () => void; // 接收編輯事件
};

export default function PmTodoDetail({ task, onClose, onEdit }: PmTodoDetailProps) {
  const utils = trpc.useUtils();

  // 實作刪除 Mutation
  const deleteMutation = trpc.todo.deleteToDo_PM.useMutation({
    onSuccess: () => {
      toast.success("任務已成功刪除");
      utils.todo.getToDoAll_PM.invalidate(); // 更新左側列表
      onClose(); // 刪除後關閉右側面板
    },
    onError: () => {
      toast.error("刪除失敗");
    }
  });

  const handleDelete = () => {
    if (confirm("確定要刪除這筆任務嗎？相關的子任務也會受到影響。")) {
      deleteMutation.mutate({ id: task.id });
    }
  };

  if (!task) return null;

  const staffTodos: StaffTodo[] = task.staffTodos || [];
  const completedStaffTodos = staffTodos.filter(t => t.completed).length;
  const progress = staffTodos.length > 0 
    ? Math.round((completedStaffTodos / staffTodos.length) * 100) 
    : 0;

  return (
    <div className="flex flex-col h-full bg-white shadow-[-4px_0_12px_rgba(0,0,0,0.03)] animate-in slide-in-from-right-8 duration-300">
      {/* 標頭區 */}
      <div className="px-6 py-5 border-b border-[#edebe9] flex justify-between items-start">
        <div>
          <h2 className="text-[20px] font-semibold text-[#201f1e] leading-tight mb-2">
            {task.Title}
          </h2>
          <div className="flex items-center gap-2 text-[13px] text-[#605e5c]">
            <Badge variant="outline" className={task.Isconfirm ? "text-green-700 bg-green-50" : "text-amber-700 bg-amber-50"}>
              {task.Isconfirm ? "已確認" : "待確認"}
            </Badge>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> 負責人: {task.staff_name || "未指派"}
            </span>
          </div>
        </div>
        
        {/* 操作按鈕區：編輯、刪除、關閉 */}
        <div className="flex items-center gap-1">
          <button 
            onClick={onEdit}
            className="p-1.5 text-[#605e5c] hover:text-[#005fb8] hover:bg-[#eff6fc] rounded transition-colors"
            title="編輯任務"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-1.5 text-[#605e5c] hover:text-[#a4262c] hover:bg-[#fde7e9] rounded transition-colors"
            title="刪除任務"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-[#edebe9] mx-1"></div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#605e5c] hover:bg-[#f3f2f1] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 內容區 (保持不變) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* 進度條 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[14px] font-semibold text-[#201f1e]">員工子任務進度</h3>
            <span className="text-[13px] text-[#605e5c]">{completedStaffTodos} / {staffTodos.length} 完成</span>
          </div>
          <div className="w-full bg-[#edebe9] h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#005fb8] h-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 員工子任務清單 */}
        <div>
          <h3 className="text-[14px] font-semibold text-[#201f1e] mb-3">詳細指派工作 (Staff TODOs)</h3>
          {staffTodos.length === 0 ? (
            <div className="text-[13px] text-[#a19f9d] py-4 text-center border-2 border-dashed border-[#edebe9] rounded">
              尚未指派子任務給任何員工
            </div>
          ) : (
            <div className="space-y-2">
              {staffTodos.map(st => (
                <div key={st.id} className="flex items-start gap-3 p-3 bg-[#faf9f8] border border-[#edebe9] rounded hover:border-[#c8c6c4] transition-colors">
                  {st.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#107c10] flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#a19f9d] flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-[14px] ${st.completed ? "text-[#605e5c] line-through" : "text-[#201f1e]"}`}>
                      {st.Title}
                    </p>
                    <p className="text-[12px] text-[#605e5c] mt-1 flex items-center gap-1">
                      <User className="w-3 h-3" /> {st.staff?.name || "未知員工"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
