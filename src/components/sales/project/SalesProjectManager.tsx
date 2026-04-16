"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
// 替換為你實際的 trpc 路徑
import { trpc } from "../../../../trpc/client"; 

import SalesProjectList from "./SalesProjectList";
import SalesProjectDetail from "./SalesProjectDetail";

export default function SalesProjectManager() {
  // ✅ 1. 啟用真實的 tRPC API 呼叫
  const { data: projects, isLoading } = trpc.project.getSalesProjects.useQuery();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-8 text-slate-500 text-[14px] animate-pulse">載入專案資料中...</div>;
  }

  const selectedProject = projects?.find(p => p.id === selectedId);

  return (
    <div className="bg-[#faf9f8] h-[75vh] min-h-[600px] border border-slate-200 rounded-lg overflow-hidden flex flex-col font-sans shadow-sm">
      
      {/* 頂部操作列 */}
      <div className="bg-white border-b border-slate-200 h-14 flex items-center px-5 justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-slate-800">
            我的業務專案 (Sales Projects)
          </h2>
          <p className="text-[12px] text-slate-500">追蹤客戶專案進度與 PM 指派狀況</p>
        </div>
        <Link 
          href="/projects/new" 
          className="flex items-center gap-1.5 bg-[#005fb8] hover:bg-[#004e98] text-white px-4 py-2 rounded-md text-[13px] font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          建立專案並指派 PM
        </Link>
      </div>

      {/* 主從式佈局 (Master-Detail) */}
      <div className="flex flex-1 overflow-hidden relative bg-slate-50/50">
        
        {/* 左側清單 */}
        <div className={`transition-all duration-300 overflow-y-auto border-r border-slate-200 bg-white ${selectedId ? "w-1/3 min-w-[300px]" : "w-full"}`}>
          <SalesProjectList 
            projects={projects || []} 
            selectedId={selectedId} 
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)} 
          />
        </div>

        {/* 右側詳細面板 */}
        {selectedId && selectedProject && (
          <div className="flex-1 bg-white z-10 relative">
            <SalesProjectDetail 
              project={selectedProject} 
              onClose={() => setSelectedId(null)} 
            />
          </div>
        )}

      </div>
    </div>
  );
}
