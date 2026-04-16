"use client";

import { Building2, UserCircle, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SalesProjectListProps = {
  projects: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function SalesProjectList({ projects, selectedId, onSelect }: SalesProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Building2 className="w-12 h-12 text-slate-200 mb-4" />
        <p className="text-[15px] font-medium">目前沒有您負責的專案</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-1 p-3">
      {projects.map((project) => {
        const isSelected = project.id === selectedId;
        
        // 假設狀態顏色 (可依據你的 Prisma 真實狀態調整)
        const statusColors: Record<string, string> = {
          "進行中": "bg-blue-100 text-blue-700",
          "已完成": "bg-green-100 text-green-700",
          "待啟動": "bg-slate-100 text-slate-700",
        };
        const badgeColor = statusColors[project.status] || "bg-slate-100 text-slate-700";

        return (
          <div
            key={project.id}
            onClick={() => onSelect(project.id)}
            className={`
              group flex flex-col p-4 cursor-pointer rounded-md border transition-all duration-200
              ${isSelected 
                ? "bg-[#eff6fc] border-[#005fb8] shadow-sm" 
                : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50 border-b-slate-100"}
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className={`text-[15px] font-semibold truncate ${isSelected ? "text-[#005fb8]" : "text-slate-800"}`}>
                {project.name}
              </h3>
              <Badge className={`${badgeColor} border-none shadow-none text-[11px] px-2 py-0.5`}>
                {project.status || "進行中"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[12px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate">{project.customer?.name || "未知客戶"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserCircle className="w-3.5 h-3.5" />
                <span className="truncate">PM: {project.pm?.name || "尚未指派"}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
