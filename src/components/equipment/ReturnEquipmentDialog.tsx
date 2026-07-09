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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/utils/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: any;
  onSuccess: () => void;
}

export function ReturnEquipmentDialog({ open, onOpenChange, equipment, onSuccess }: Props) {
  const [condition, setCondition] = useState("PERFECT");
  const [notes, setNotes] = useState("");

  const returnMutation = api.equipment.staffCheckin.useMutation({
    onSuccess: (data) => {
      const costMsg = data.totalCost > 0 ? `（費用：$${data.totalCost.toFixed(2)}）` : "";
      toast.success(`設備歸還成功！${costMsg}`);
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = async () => {
    await returnMutation.mutateAsync({
      equipmentId: equipment.id,
      notes: notes || undefined,
      condition,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-green-600" />
            歸還設備
          </DialogTitle>
          <DialogDescription>
            歸還 <strong>{equipment?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {equipment?.billingType !== "NONE" && equipment?.price > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              此設備為計費設備（{equipment.billingType === "HOURLY" ? "按小時" : "按天"}，${equipment.price}）
              ，系統將自動計算費用。
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium">歸還狀況</label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERFECT">完好無損</SelectItem>
                <SelectItem value="MINOR_DAMAGE">輕微損耗</SelectItem>
                <SelectItem value="DAMAGED">損壞</SelectItem>
                <SelectItem value="BROKEN">嚴重毀損</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">歸還備註</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：電池電量不足、鏡頭有輕微刮痕..."
              className="h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSubmit}
            disabled={returnMutation.isPending}
          >
            {returnMutation.isPending ? "處理中..." : "確認歸還"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
