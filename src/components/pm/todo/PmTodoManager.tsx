"use client";

import { useState } from "react";
// 假設這是你的 trpc 匯入路徑，請根據實作替換

import PmTodoGrid from "./PmTodoGrid";
import PmTodoDetail from "./PmTodoDetail";
import { Plus } from "lucide-react";
import { trpc } from "../../../../trpc/client";

export default function PmTodoManager() {
  // 1. 呼叫 tRPC 取得 PM 的所有任務
  const { data: todos, isLoading, isError } = trpc.todo.getToDoAll_PM.useQuery();
  
  // 2. 狀態管理：目前選中的任務 ID
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-8 text-[#605e5c] text-[14px] animate-pulse">載入專案任務中...</div>;
  }

  if (isError) {
    return <div className="p-8 text-[#a4262c]">載入失敗，請確認權限或網路連線。</div>;
  }

  // 取得目前選中的任務資料，傳給 Detail Panel
  const selectedTask = todos?.find(t => t.id === selectedId);

  return (
    // 微軟風格：背景灰，整體有一個淺淺的邊框包裹
    <div className="bg-[#faf9f8] h-[75vh] min-h-[600px] border border-[#edebe9] rounded-md overflow-hidden flex flex-col font-sans">
      
      {/* 頂部操作列 (Command Bar) */}
      <div className="bg-white border-b border-[#edebe9] h-12 flex items-center px-4 justify-between">
        <h2 className="text-[15px] font-semibold text-[#201f1e]">
          專案任務管理 (PM Tasks)
        </h2>
        <button className="flex items-center gap-1.5 bg-[#005fb8] hover:bg-[#004e98] text-white px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors">
          <Plus className="w-4 h-4" />
          新增任務
        </button>
      </div>

      {/* 主從式佈局 (Master-Detail Layout) */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* 左側清單 (當右側打開時，左側會自動縮小寬度) */}
        <div className={`transition-all duration-300 overflow-y-auto ${selectedId ? "w-1/2 lg:w-2/5" : "w-full"}`}>
          <PmTodoGrid 
            todos={todos || []} 
            selectedId={selectedId} 
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)} // 點擊同一個就取消選取
          />
        </div>

        {/* 右側詳細面板 (只有在有選取時才顯示) */}
        {selectedId && selectedTask && (
          <div className="w-1/2 lg:w-3/5 bg-white z-10">
            <PmTodoDetail 
              task={selectedTask} 
              onClose={() => setSelectedId(null)} 
            />
          </div>
        )}

      </div>
    </div>
  );
}
