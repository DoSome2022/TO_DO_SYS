"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRevertToVersion } from "../../../../hooks/sales/useQuotationVersions";


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  targetVersion: any;
}

export default function RevertVersionDialog({
  open,
  onOpenChange,
  quotationId,
  targetVersion,
}: Props) {
  const [changeLog, setChangeLog] = useState("");
  const revertToVersion = useRevertToVersion();

  if (!targetVersion) return null;

  const handleRevert = async () => {
    try {
      await revertToVersion.mutateAsync({
        quotationId,
        targetVersionId: targetVersion.id,
        changeLog:
          changeLog.trim() || `回滾至第 ${targetVersion.versionNumber} 版`,
      });
      toast.success(
        `已回滾至第 ${targetVersion.versionNumber} 版，並建立新版本`
      );
      onOpenChange(false);
    } catch {
      toast.error("回滾失敗");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            回滾版本確認
          </DialogTitle>
          <DialogDescription>
            你將回到第 {targetVersion.versionNumber} 版（
            {targetVersion.changeLog || "無說明"}）
            ，
            系統會自動建立一個新版本作為記錄，歷史版本不會被刪除。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 版本資訊 */}
          <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">目標版本：</span>
              <span className="font-mono font-medium">
                v{targetVersion.versionNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">建立時間：</span>
              <span>
                {new Date(targetVersion.createdAt).toLocaleString()}
              </span>
            </div>
            {targetVersion.changeLog && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">說明：</span>
                <span>{targetVersion.changeLog}</span>
              </div>
            )}
          </div>

          {/* 變更說明 */}
          <div className="space-y-2">
            <Label>回滾原因（選填）</Label>
            <Input
              placeholder={`例如：客戶要回到第 ${targetVersion.versionNumber} 版的方案`}
              value={changeLog}
              onChange={(e) => setChangeLog(e.target.value)}
            />
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-sm text-orange-800 dark:text-orange-200">
            <p className="font-medium">⚠️ 回滾後將會：</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
              <li>報價單標題、金額、備註回復至第 {targetVersion.versionNumber} 版</li>
              <li>服務項目清單完全替換為該版本的內容</li>
              <li>自動建立新版本（v{targetVersion.versionNumber + 1}）作為回滾記錄</li>
              <li>所有歷史版本保留不變，可隨時查看</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevert}
            disabled={revertToVersion.isPending}
          >
            {revertToVersion.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                回滾中...
              </>
            ) : (
              "確認回滾"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
