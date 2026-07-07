// src/components/SalesProjectDetail.tsx

"use client";

// ✅ 1. 這裡加上了 Building2
import { X, ExternalLink, FileText, Briefcase,  Building2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

type SalesProjectDetailProps = {
  project: any;
  onClose: () => void;
};



export default function SalesProjectDetail({ project, onClose }: SalesProjectDetailProps) {
  
   const router = useRouter();  // ← 加入這行
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
          {/* 前往對話 + close 按鈕 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/sales/projects/${project.id}/chat`)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              前往對話
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
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



      </div>
    </div>
  );
}
