"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import QuotationItemDialog from "./QuotationItemDialog";
import { useRemoveItem } from "../../../../hooks/sales/useQuotationItems";

interface Props {
  quotationId: string;
  items: any[];
}

export default function QuotationItemManager({ quotationId, items }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const removeItem = useRemoveItem();

  const handleDelete = async (itemId: string) => {
    if (!confirm("確定要移除此項目嗎？")) return;
    try {
      await removeItem.mutateAsync({ itemId, quotationId });
      toast.success("項目已移除");
    } catch {
      toast.error("移除失敗");
    }
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  const totalAmount = items.reduce(
    (sum: number, item: any) => sum + Number(item.subtotal),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">服務項目</h3>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
          新增項目
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          尚無服務項目，點擊上方按鈕新增
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-4">
              <div className="flex-1">
                <p className="font-medium">{item.customName}</p>
                <p className="text-sm text-muted-foreground">
                  x {item.quantity} · $ {Number(item.unitPrice).toLocaleString()}
                </p>
              </div>
              <div className="text-right mr-4">
                <p className="font-mono">$ {Number(item.subtotal).toLocaleString()}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => handleDelete(item.id)}
                  disabled={removeItem.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <QuotationItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        quotationId={quotationId}
        editItem={editItem}
      />
    </div>
  );
}
