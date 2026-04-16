"use client";

import { CheckCircle2, Circle, Paperclip, User, X } from "lucide-react";
// 假設你使用了 shadcn 的 Badge
import { Badge } from "@/components/ui/badge"; 

// 定義從 tRPC 推導出來的型別 (可根據實際情況調整)
type StaffTodo = {
  id: string;
  Title: string;
  completed: boolean;
  staff: { name: string | null } | null;
};

type PmTodoDetailProps = {
  task: any; // 實務上請換成 RouterOutputs["todo"]["getToDoById_PM"]
  onClose: () => void;
};

export default function PmTodoDetail({ task, onClose }: PmTodoDetailProps) {
  if (!task) return null;

  // 計算員工子任務進度
  const staffTodos: StaffTodo[] = task.staffTodos || [];
  const completedStaffTodos = staffTodos.filter(t => t.completed).length;
  const progress = staffTodos.length > 0 
    ? Math.round((completedStaffTodos / staffTodos.length) * 100) 
    : 0;

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#edebe9] shadow-[-4px_0_12px_rgba(0,0,0,0.03)] animate-in slide-in-from-right-8 duration-300">
      {/* 標頭區 (微軟風格喜歡大標題配緊湊的輔助資訊) */}
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
        <button 
          onClick={onClose}
          className="p-1.5 text-[#605e5c] hover:bg-[#f3f2f1] rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* 進度條 (Microsoft Planner 風格) */}
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

        {/* 附件區塊 */}
        <div>
           <h3 className="text-[14px] font-semibold text-[#201f1e] mb-3 flex items-center gap-1">
             <Paperclip className="w-4 h-4" /> 附件 ({task.attachments?.length || 0})
           </h3>
           {/* 這裡未來可擴充附件清單 */}
        </div>

      </div>
    </div>
  );
}
