"use client";

import { useState } from "react";
import { Plus } from "lucide-react";


import PmTodoGrid from "./PmTodoGrid";
import PmTodoDetail from "./PmTodoDetail";

import { trpc } from "../../../../trpc/client";
import { PmTodoFormDialog } from "./PmRodoFormDialog";

export default function PmTodoManager() {
  // 1. 呼叫 tRPC 取得 PM 的所有任務
  const { data: todos, isLoading, isError } = trpc.todo.getToDoAll_PM.useQuery();
  
  // 2. 狀態管理：目前選中的任務 ID
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 3. 表單彈窗狀態管理
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<any>(null);

  // 處理新增
  const handleCreateNew = () => {
    setEditingTodo(null); // null 代表新建
    setIsDialogOpen(true);
  };

  // 處理編輯 (傳遞給 Detail 面板呼叫)
  const handleEdit = (task: any) => {
    setEditingTodo({
      id: task.id,
      title: task.Title || "",
      completed: task.completed || false,
      Isconfirm: task.Isconfirm || false,
      staff_name: task.staff_name || "",
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-8 text-[#605e5c] text-[14px] animate-pulse">載入專案任務中...</div>;
  }

  if (isError) {
    return <div className="p-8 text-[#a4262c]">載入失敗，請確認權限或網路連線。</div>;
  }

  const selectedTask = todos?.find(t => t.id === selectedId);

  return (
    <div className="bg-[#faf9f8] h-[75vh] min-h-[600px] border border-[#edebe9] rounded-md overflow-hidden flex flex-col font-sans relative">
      
      {/* 頂部操作列 (Command Bar) */}
      <div className="bg-white border-b border-[#edebe9] h-12 flex items-center px-4 justify-between">
        <h2 className="text-[15px] font-semibold text-[#201f1e]">
          專案任務管理 (PM Tasks)
        </h2>
        <button 
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 bg-[#005fb8] hover:bg-[#004e98] text-white px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增任務
        </button>
      </div>

      {/* 主從式佈局 (Master-Detail Layout) */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* 左側清單 */}
        <div className={`transition-all duration-300 overflow-y-auto ${selectedId ? "w-1/2 lg:w-2/5" : "w-full"}`}>
          <PmTodoGrid 
            todos={todos || []} 
            selectedId={selectedId} 
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)} 
          />
        </div>

        {/* 右側詳細面板 */}
        {selectedId && selectedTask && (
          <div className="w-1/2 lg:w-3/5 bg-white z-10 border-l border-[#edebe9]">
            <PmTodoDetail 
              task={selectedTask} 
              onClose={() => setSelectedId(null)} 
              onEdit={() => handleEdit(selectedTask)} // 傳遞編輯函數
            />
          </div>
        )}
      </div>

      {/* 新增 / 編輯 表單彈窗 */}
      <PmTodoFormDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={editingTodo}
      />
    </div>
  );
}
