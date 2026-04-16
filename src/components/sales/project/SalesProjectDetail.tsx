"use client";

// ✅ 1. 這裡加上了 Building2
import { X, ExternalLink, FileText, Briefcase, ChevronRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SalesProjectDetailProps = {
  project: any;
  onClose: () => void;
};



export default function SalesProjectDetail({ project, onClose }: SalesProjectDetailProps) {
  if (!project) return null;

  console.log("-- Data :  --", project ,"-- End --")


  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-[-4px_0_12px_rgba(0,0,0,0.03)] animate-in slide-in-from-right-8 duration-300">
      
      {/* 標頭區 */}
      <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-start bg-slate-50/50">
        <div>
          {/* ✅ 2. 改用專案 ID 的前 8 碼當作編號 */}
          <Badge variant="outline" className="mb-2 bg-white">
            PRJ-{project.id?.substring(0, 8).toUpperCase() || "0000"}
          </Badge>
          {/* ✅ 3. 改用 project.title (對應 Prisma Schema) */}
          <h2 className="text-[20px] font-bold text-slate-800 leading-tight">
            {project.title}
          </h2>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* 客戶與報價資訊區 (Sales 最關心的) */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-3">關聯商業資訊</h3>
          <div className="space-y-3 text-[14px]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-500 flex items-center gap-2"><Building2 className="w-4 h-4"/> 客戶</span>
              <span className="font-medium text-slate-800">{project.customer?.name || "無"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-500 flex items-center gap-2"><FileText className="w-4 h-4"/> 關聯報價單</span>
              <button className="text-[#005fb8] hover:underline font-medium flex items-center gap-1 text-[13px]">
                {/* ✅ 4. 改用 Quotation ID 顯示 */}
                {project.quotation?.id 
                  ? `QT-${project.quotation.id.substring(0,6).toUpperCase()}` 
                  : "未綁定報價單"} 
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-2"><Briefcase className="w-4 h-4"/> 指派 PM</span>
              <span className="font-medium text-slate-800">{project.pm?.name || "等待指派"}</span>
            </div>
          </div>
        </div>

        {/* 專案執行階段 (Sales 用來監控 PM 用的) */}
        <div>
          <h3 className="text-[14px] font-semibold text-slate-800 mb-4">專案執行階段 (由 PM 維護)</h3>
          
          <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {/* 這裡模擬專案階段 (ProjectPhase)，實務上替換為 project.phases.map(...) */}
            {[
              { name: "需求確認與開案", status: "completed", date: "2024-04-01" },
              { name: "設計與開發階段", status: "current", date: "進行中" },
              { name: "客戶驗收與交付", status: "pending", date: "待啟動" }
            ].map((phase, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2
                  ${phase.status === 'completed' ? 'bg-green-500' : phase.status === 'current' ? 'bg-[#005fb8] animate-pulse' : 'bg-slate-200'}
                `}>
                  {phase.status === 'completed' && <X className="hidden" />} {/* 佔位 */}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-bold text-[14px] ${phase.status === 'current' ? 'text-[#005fb8]' : 'text-slate-700'}`}>{phase.name}</h4>
                  </div>
                  <div className="text-[12px] text-slate-500">{phase.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
