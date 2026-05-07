// src/app/admin/finance/components/QuotationEditModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { api } from "@/utils/api";
import { cn } from "@/lib/utils";

// ── 輔助函式 ──
const toNumber = (val: unknown): number => {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null && "toNumber" in val) {
    return (val as { toNumber(): number }).toNumber();
  }
  return Number(val);
};

interface QuotationItemForm {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  _subtotal: number;
}

interface QuotationEditForm {
  title: string;
  note: string;
  validUntil: string;
  items: QuotationItemForm[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  quotation: {
    id: string;
    title?: string | null;
    note?: string | null;
    validUntil?: string | Date | null;
    items?: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: unknown;
      description?: string | null;
    }>;
  };
  accentColor?: string;
}

export default function QuotationEditModal({ open, onClose, onSuccess, quotation, accentColor = "#0078D4" }: Props) {
  const utils = api.useUtils();

  // ── tRPC Mutations ──
  const updateQuotation = api.adminQuotation.update.useMutation({
    onSuccess: () => {
      utils.adminQuotation.getById.invalidate({ id: quotation.id });
      utils.adminQuotation.search.invalidate();
    },
  });

  const updateItem = api.adminQuotation.updateItem.useMutation();
  const addItem = api.adminQuotation.addItem.useMutation();
  const removeItem = api.adminQuotation.removeItem.useMutation();

  // ── React Hook Form ──
  const { register, control, handleSubmit, watch, setValue, reset, formState: { isDirty } } = useForm<QuotationEditForm>({
    defaultValues: {
      title: "",
      note: "",
      validUntil: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const [saving, setSaving] = useState(false);

  // ── 初始化表單 ──
  useEffect(() => {
    if (open && quotation) {
      reset({
        title: quotation.title ?? "",
        note: quotation.note ?? "",
        validUntil: quotation.validUntil
          ? new Date(quotation.validUntil).toISOString().split("T")[0]
          : "",
        items: (quotation.items ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: toNumber(item.unitPrice),
          _subtotal: toNumber(item.unitPrice) * item.quantity,
        })),
      });
    }
  }, [open, quotation, reset]);

  // ── 計算小計 ──
  const calculateSubtotal = (idx: number) => {
    const items = watch("items");
    const item = items[idx];
    if (item) {
      const subtotal = (item.unitPrice || 0) * (item.quantity || 0);
      setValue(`items.${idx}._subtotal`, subtotal);
    }
  };

  // ── 計算總計 ──
  const totalAmount = watchedItems?.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0) ?? 0;

  // ── 提交 ──
  const onSubmit = async (data: QuotationEditForm) => {
    setSaving(true);
    try {
      // 1. 更新報價單標題/備註
      await updateQuotation.mutateAsync({
        id: quotation.id,
        title: data.title,
        note: data.note || null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      });

      // 2. 逐一更新/新增/刪除明細
      const existingIds = new Set(quotation.items?.map((i) => i.id) ?? []);
      const submittedIds = new Set<string>();

      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (item.id && existingIds.has(item.id)) {
          // 更新既有項目
          submittedIds.add(item.id);
          await updateItem.mutateAsync({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          });
        } else {
          // 新增項目
          const newItem = await addItem.mutateAsync({
            quotationId: quotation.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          });
          if (newItem?.id) submittedIds.add(newItem.id);
        }
      }

      // 3. 刪除被移除的項目
      for (const id of existingIds) {
        if (!submittedIds.has(id)) {
          await removeItem.mutateAsync({ id });
        }
      }

      // 4. 刷新資料
      await utils.adminQuotation.getById.invalidate({ id: quotation.id });
      await utils.adminQuotation.search.invalidate();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("編輯報價單失敗", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>編輯報價單</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ── 基本資訊 ── */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-500">基本資訊</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>標題</Label>
                <Input {...register("title")} placeholder="報價單標題" />
              </div>
              <div>
                <Label>有效期限</Label>
                <Input type="date" {...register("validUntil")} />
              </div>
            </div>
            <div>
              <Label>備註</Label>
              <Textarea {...register("note")} placeholder="備註（選填）" rows={2} />
            </div>
          </div>

          {/* ── 分隔線 ── */}
          <hr className="border-zinc-200 dark:border-zinc-700" />

          {/* ── 報價明細 ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-zinc-500">報價明細</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: "", quantity: 1, unitPrice: 0, _subtotal: 0 })}
              >
                <Plus size={14} className="mr-1" /> 新增項目
              </Button>
            </div>

            {/* 表格標題 */}
            <div className="grid grid-cols-[1fr_80px_120px_100px_40px] gap-2 text-xs font-medium text-zinc-400 px-2">
              <span>品項名稱</span>
              <span className="text-right">數量</span>
              <span className="text-right">單價</span>
              <span className="text-right">小計</span>
              <span></span>
            </div>

            {/* 項目列表 */}
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-[1fr_80px_120px_100px_40px] gap-2 items-center">
                <Input
                  {...register(`items.${idx}.name`, { required: "必填" })}
                  placeholder="品項名稱"
                  className="text-sm"
                />
                <Input
                  type="number"
                  min={1}
                  {...register(`items.${idx}.quantity`, {
                    valueAsNumber: true,
                    onChange: () => calculateSubtotal(idx),
                  })}
                  className="text-sm text-right"
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  {...register(`items.${idx}.unitPrice`, {
                    valueAsNumber: true,
                    onChange: () => calculateSubtotal(idx),
                  })}
                  className="text-sm text-right"
                />
                <div className="text-sm text-right font-medium text-blue-600">
                  ${((watchedItems?.[idx]?.unitPrice ?? 0) * (watchedItems?.[idx]?.quantity ?? 0)).toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* 總計 */}
            <div className="flex justify-end items-center gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <span className="text-sm font-medium text-zinc-500">總計</span>
              <span className="text-lg font-bold text-blue-600">
                ${totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* ── 按鈕 ── */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: accentColor }}
              className="text-white hover:brightness-110"
            >
              {saving ? "儲存中..." : "儲存變更"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
