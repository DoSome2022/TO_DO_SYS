// src/components/QuotationVersionSidebar.tsx
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, FileText } from "lucide-react";
import { format } from "date-fns";

// 型別調整為可接收 WorkVersion 資料（從 selectedVersions 來）
type VersionItem = {
  id: string;
  versionNumber?: number;
  versionName?: string;
  name?: string;
  status?: string;
  createdAt?: string | Date;
  phaseName?: string;
  phaseStatus?: string;
};

type Props = {
  versions: VersionItem[];
  selectedVersionId: string | null;
  onSelectVersion: (id: string) => void;
};

export default function QuotationVersionSidebar({
  versions,
  selectedVersionId,
  onSelectVersion,
}: Props) {
  return (
    <div className="border rounded-lg bg-white h-fit">
      {/* 頂部標題 */}
      <div className="p-3 border-b bg-gray-50 rounded-t-lg">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          版本歷史記錄
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          共 {versions.length} 個版本
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="p-2 space-y-2">
          {versions.map((version) => {
            const versionLabel =
              version.versionNumber
                ? `v${version.versionNumber}：${version.versionName || version.name || ""}`
                : version.versionName || version.name || "未命名版本";

            const isCompleted = version.status === "COMPLETED";

            return (
              <button
                key={version.id}
                onClick={() => onSelectVersion(version.id)}
                className={`w-full text-left rounded-md overflow-hidden transition-all border ${
                  selectedVersionId === version.id
                    ? "border-blue-300 ring-1 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* ✅ 仿 PhaseManager 階段標題欄樣式 */}
                <div className="bg-gray-50 px-3 py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <h4 className="font-semibold text-sm text-gray-800 truncate">
                      {version.phaseName && `📁 ${version.phaseName}`}
                    </h4>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium shrink-0 ml-2">
                    {version.status || "IN_PROGRESS"}
                  </span>
                </div>

                {/* 次要資訊列（所屬階段 + 建立時間） */}
                <div className="px-3 py-1.5 flex justify-between items-center text-[11px] text-muted-foreground bg-white">
                  <span>
                    {/* {version.phaseName && `📁 ${version.phaseName}`} */}
                  </span>
                  {version.createdAt && (
                    <span>
                      {format(new Date(version.createdAt), "MM/dd HH:mm")}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {versions.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">
              此專案尚無任何版本
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
