// components/staff/VersionContentPreview.tsx
"use client";

import { ExternalLink, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VersionContentPreviewProps {
  version: {
    id: string;
    versionName: string;
    contentUrl: string | null;
    note: string | null;
    phaseId: string | null;
    createdAt: Date | string;
  };
}

export function VersionContentPreview({ version }: VersionContentPreviewProps) {
  // 判斷是否已經被 PM 選用 (綁定到 phase)
  const isApprovedByPM = version.phaseId !== null;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* 頂部標題與狀態 */}
      <div className="flex justify-between items-start border-b pb-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold">{version.versionName}</h2>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span>提交時間: {new Date(version.createdAt).toLocaleString()}</span>
          </div>
        </div>
        
        {/* 狀態標籤 */}
        <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-1.5 font-medium ${
          isApprovedByPM ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}>
          {isApprovedByPM ? (
            <><CheckCircle2 className="w-4 h-4" /> PM 已採用 (正式階段)</>
          ) : (
            <><Clock className="w-4 h-4" /> 資源池待審核中</>
          )}
        </div>
      </div>

      {/* 內容區塊 */}
      <div className="flex-1 overflow-auto space-y-6">
        {/* 備註區塊 */}
        {version.note && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">版本備註：</h3>
            <p className="text-sm whitespace-pre-wrap">{version.note}</p>
          </div>
        )}

        {/* 檔案/連結預覽區塊 */}
        <div className="border rounded-lg p-6 bg-card flex flex-col items-center justify-center min-h-[300px] border-dashed">
          {version.contentUrl ? (
            <div className="text-center space-y-4">
              <div className="text-muted-foreground mb-4">
                這個版本包含外部連結或檔案
              </div>
              <Button asChild variant="outline">
                <a href={version.contentUrl} target="_blank" rel="noopener noreferrer">
                  開啟內容連結 <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              {/* 如果確定是圖片，可以直接用 <img src={version.contentUrl} /> 預覽 */}
            </div>
          ) : (
            <div className="text-muted-foreground">此版本未附帶連結或檔案。</div>
          )}
        </div>
      </div>
    </div>
  );
}
