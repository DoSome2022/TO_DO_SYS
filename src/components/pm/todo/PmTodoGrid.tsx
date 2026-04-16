"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";

type PmTodoGridProps = {
  todos: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function PmTodoGrid({ todos, selectedId, onSelect }: PmTodoGridProps) {
  
  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#605e5c]">
        <CheckCircle2 className="w-12 h-12 text-[#edebe9] mb-4" />
        <p className="text-[15px] font-medium">目前沒有待辦的專案任務</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-1 p-4">
      {todos.map((todo) => {
        const isSelected = todo.id === selectedId;
        const totalStaff = todo.staffTodos?.length || 0;
        const completedStaff = (todo.staffTodos || []).filter((t: any) => t.completed).length;

        return (
          <div
            key={todo.id}
            onClick={() => onSelect(todo.id)}
            className={`
              group flex items-center p-3 cursor-pointer rounded border transition-all duration-200
              ${isSelected 
                ? "bg-[#eff6fc] border-[#005fb8] shadow-[0_2px_4px_rgba(0,0,0,0.05)]" // 微軟藍選中狀態
                : "bg-white border-transparent hover:border-[#edebe9] hover:bg-[#faf9f8] border-b-[#edebe9]"}
            `}
          >
            {/* 狀態圖標 */}
            <div className="mr-4">
              {todo.completed ? (
                <CheckCircle2 className="w-5 h-5 text-[#005fb8]" />
              ) : (
                <Circle className={`w-5 h-5 ${isSelected ? "text-[#005fb8]" : "text-[#c8c6c4] group-hover:text-[#605e5c]"}`} />
              )}
            </div>

            {/* 標題與資訊 */}
            <div className="flex-1 min-w-0">
              <p className={`text-[14px] font-medium truncate ${todo.completed ? "text-[#605e5c] line-through" : "text-[#201f1e]"}`}>
                {todo.Title}
              </p>
              <div className="flex items-center gap-3 mt-1 text-[12px] text-[#605e5c]">
                <span>{todo.staff_name || "未指派"}</span>
                {totalStaff > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    子任務: {completedStaff}/{totalStaff}
                  </span>
                )}
              </div>
            </div>

            {/* 右側標籤 */}
            <div className="ml-4">
              {todo.Isconfirm && (
                <span className="text-[11px] px-2 py-0.5 bg-[#dff6dd] text-[#107c10] font-medium rounded">
                  已確認
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
