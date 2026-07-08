"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  RotateCcw,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { zhHK } from "date-fns/locale";

import { toast } from "sonner";
import { useCreateVersion, useVersions } from "../../../../hooks/sales/useQuotationVersions";
import RevertVersionDialog from "./RevertVersionDialog";

interface Props {
  quotationId: string;
  currentVersionId?: string | null;
}

export default function VersionTimeline({ quotationId, currentVersionId }: Props) {
  const { data: versions, isLoading } = useVersions(quotationId);
  const createVersion = useCreateVersion();
  const [expanded, setExpanded] = useState(false);
  const [revertTarget, setRevertTarget] = useState<any>(null);

  const handleCreateVersion = async () => {
    try {
      await createVersion.mutateAsync({
        quotationId,
        changeLog: `手動存檔 — ${format(new Date(), "MM/dd HH:mm")}`,
      });
      toast.success("版本已建立");
    } catch {
      toast.error("建立版本失敗");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      {/* 標題列 */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">版本歷史</span>
          {versions && (
            <Badge variant="secondary" className="text-xs">
              共 {versions.length} 版
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleCreateVersion();
            }}
            disabled={createVersion.isPending}
          >
            {createVersion.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <FileText className="w-3 h-3 mr-1" />
            )}
            建立版本
          </Button>
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* 版本列表 */}
      {expanded && versions && versions.length > 0 && (
        <div className="border-t px-4 pb-4">
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2 mt-2">
              {versions.map((version: any) => {
                const isCurrent = version.id === currentVersionId;
                return (
                  <div
                    key={version.id}
                    className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                      isCurrent
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-xs">
                          v{version.versionNumber}
                        </span>
                        {isCurrent && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1 text-primary border-primary"
                          >
                            目前
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground truncate">
                          {version.changeLog || `第 ${version.versionNumber} 版`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(version.createdAt), "yyyy/MM/dd HH:mm", {
                          locale: zhHK,
                        })}
                        {version.createdBy && ` · ${version.createdBy}`}
                      </p>
                    </div>

                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-orange-600 hover:text-orange-700 shrink-0"
                        onClick={() => setRevertTarget(version)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        回滾
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {expanded && (!versions || versions.length === 0) && (
        <div className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
          尚無版本記錄，點擊「建立版本」開始記錄
        </div>
      )}

      {/* 回滾對話框 */}
      <RevertVersionDialog
        open={!!revertTarget}
        onOpenChange={(open) => {
          if (!open) setRevertTarget(null);
        }}
        quotationId={quotationId}
        targetVersion={revertTarget}
      />
    </div>
  );
}
