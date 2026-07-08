"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAddItem, useUpdateItem } from "../../../../hooks/sales/useQuotationItems";


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  editItem?: any; // 編輯模式傳入
}

export default function QuotationItemDialog({ open, onOpenChange, quotationId, editItem }: Props) {
  const isEdit = !!editItem;
  const addItem = useAddItem();
  const updateItem = useUpdateItem();

  const [customName, setCustomName] = useState(editItem?.customName || "");
  const [quantity, setQuantity] = useState(editItem?.quantity || 1);
  const [unitPrice, setUnitPrice] = useState(editItem?.unitPrice || 0);

  const handleSubmit = async () => {
    if (!customName.trim()) {
      toast.error("請填寫服務名稱");
      return;
    }

    try {
      if (isEdit) {
        await updateItem.mutateAsync({
          itemId: editItem.id,
          customName: customName.trim(),
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
        });
        toast.success("項目已更新");
      } else {
        await addItem.mutateAsync({
          quotationId,
          customName: customName.trim(),
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
        });
        toast.success("項目已新增");
      }
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? "更新失敗" : "新增失敗");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯服務項目" : "新增服務項目"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>服務名稱 *</Label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="例如：UI/UX 設計"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>數量</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>單價 (HKD)</Label>
              <Input
                type="number"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="text-right text-sm text-muted-foreground">
            小計：<span className="font-mono font-medium">$ {(Number(quantity) * Number(unitPrice)).toLocaleString()}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={addItem.isPending || updateItem.isPending}>
            {isEdit ? "儲存" : "新增"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
