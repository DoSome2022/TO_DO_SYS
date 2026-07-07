// src/components/dashboard/SalesDashboard/CreatePurchaseDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useCreatePurchase, useUpdatePurchase } from "../../../../hooks/usePurchase";
import { purchaseFormSchema } from "@/lib/schemas/purchase";
// import { useCreatePurchase, useUpdatePurchase } from "@/hooks/usePurchase";

// ---------- Zod Schema ----------



type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

const statusOptions = [
  { value: "DRAFT", label: "草稿" },
  { value: "PENDING", label: "待審核" },
  { value: "APPROVED", label: "已核准" },
  { value: "ORDERED", label: "已下單" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase?: any; // 編輯模式傳入
}

export default function CreatePurchaseDialog({ open, onOpenChange, purchase }: Props) {
  const isEdit = !!purchase;
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      title: "",
      supplier: "",
      supplierContact: "",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: "",
      notes: "",
      items: [
        {
          itemName: "",
          brand: "",
          model: "",
          specification: "",
          quantity: 1,
          unitPrice: 0,
          subtotal: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // 編輯模式：載入資料
  useEffect(() => {
    if (purchase) {
      form.reset({
        title: purchase.title ?? "",
        supplier: purchase.supplier ?? "",
        supplierContact: purchase.supplierContact ?? "",
        orderDate: purchase.orderDate
          ? new Date(purchase.orderDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        expectedDate: purchase.expectedDate
          ? new Date(purchase.expectedDate).toISOString().split("T")[0]
          : "",
        notes: purchase.notes ?? "",
        items: purchase.items?.map((item: any) => ({
          itemName: item.itemName,
          brand: item.brand ?? "",
          model: item.model ?? "",
          specification: item.specification ?? "",
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })) ?? [
          {
            itemName: "",
            brand: "",
            model: "",
            specification: "",
            quantity: 1,
            unitPrice: 0,
            subtotal: 0,
          },
        ],
      });
    } else {
      form.reset();
    }
  }, [purchase, form]);

  const calculateSubtotal = (index: number) => {
    const items = form.getValues("items");
    const item = items[index];
    if (item) {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      form.setValue(`items.${index}.subtotal`, subtotal);
    }
  };

  const onSubmit = async (values: PurchaseFormValues) => {
    try {
      const payload = {
        title: values.title,
        supplier: values.supplier || null,
        supplierContact: values.supplierContact || null,
        orderDate: new Date(values.orderDate),
        expectedDate: values.expectedDate ? new Date(values.expectedDate) : null,
        notes: values.notes || null,
        items: values.items.map((item) => ({
          ...item,
          equipmentId: item.equipmentId || null,
          brand: item.brand || null,
          model: item.model || null,
          specification: item.specification || null,
          receivedQty: 0,
        })),
      };

      if (isEdit) {
        await updatePurchase.mutateAsync({ id: purchase.id, ...payload });
        toast.success("採購單已更新");
      } else {
        await createPurchase.mutateAsync(payload);
        toast.success("採購單已建立");
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error(isEdit ? "更新失敗" : "建立失敗");
    }
  };

  const totalAmount = form.watch("items").reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `編輯採購單 — ${purchase.purchaseNo}` : "新增採購單"}
          </DialogTitle>
          <DialogDescription>
            記錄設備購買資訊
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本資訊 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>採購標題 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：2026年7月攝影器材採購" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>供應商</FormLabel>
                    <FormControl>
                      <Input placeholder="廠商名稱" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplierContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>供應商聯絡方式</FormLabel>
                    <FormControl>
                      <Input placeholder="電話/窗口" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>下單日期 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>預計到貨日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 採購明細 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">採購明細</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      itemName: "",
                      brand: "",
                      model: "",
                      specification: "",
                      quantity: 1,
                      unitPrice: 0,
                      subtotal: 0,
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" />
                  新增項目
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 border rounded-lg space-y-3 relative"
                  >
                    {/* 刪除按鈕 */}
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-red-500"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.itemName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>品名 *</FormLabel>
                            <FormControl>
                              <Input placeholder="設備名稱" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.brand`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>品牌</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="品牌"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.model`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>型號</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="型號"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>數量</FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => {
                                    field.onChange(e.target.valueAsNumber || 0);  // ← ✅ 改這裡
                                    calculateSubtotal(index);
                                }}
                                />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>單價 (HKD)</FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                min={0}
                                step="0.01"
                                {...field}
                                onChange={(e) => {
                                    field.onChange(e.target.valueAsNumber || 0);  // ← ✅ 改這裡
                                    calculateSubtotal(index);
                                }}
                                />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.subtotal`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>小計</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                readOnly
                                className="bg-muted"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 總金額 */}
            <div className="text-right text-lg font-semibold">
              總金額：{" "}
              <span className="font-mono text-primary">
                {new Intl.NumberFormat("zh-HK", {
                  style: "currency",
                  currency: "HKD",
                }).format(totalAmount)}
              </span>
            </div>

            {/* 備註 */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備註</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="備註事項..."
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 按鈕 */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={createPurchase.isPending || updatePurchase.isPending}
              >
                {(createPurchase.isPending || updatePurchase.isPending)
                  ? "儲存中..."
                  : isEdit
                  ? "更新採購單"
                  : "建立採購單"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
