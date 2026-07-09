"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/utils/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: any;
  onSuccess: () => void;
}

export function ScrapEquipmentDialog({ open, onOpenChange, equipment, onSuccess }: Props) {
  const [reason, setReason] = useState("");
  const scrapMutation = api.equipment.scrap.useMutation({
    onSuccess: () => {
      toast.success("設備已報廢");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("請填寫報廢原因");
      return;
    }
    await scrapMutation.mutateAsync({
      id: equipment.id,
      scrapReason: reason.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            報廢設備
          </DialogTitle>
          <DialogDescription>
            您即將將 <strong>{equipment?.name}</strong> 標記為「報廢」。
            報廢後設備將無法再被借用。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            當前狀態：{equipment?.status === "AVAILABLE" ? "可借用" : "維修中"}
            <br />
            價值：${equipment?.value?.toLocaleString() || "0"}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">報廢原因 *</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例如：設備已無法修復 / 超過使用年限 / 零件停產..."
              className="h-24 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={scrapMutation.isPending}
          >
            {scrapMutation.isPending ? "處理中..." : "確認報廢"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
