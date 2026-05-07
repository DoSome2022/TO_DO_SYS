// src/app/admin/finance/components/AddPaymentModal.tsx

"use client";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/utils/api";   // ← 改用直接 tRPC
import { PaymentMethod, PaymentType } from "@prisma/client";

// ── 型別：直接從 Prisma Enum 推導（若 types 檔有可一併匯入）
// type PaymentMethod = "CASH" | "TRANSFER" | "CHECK" | "CREDIT_CARD" | "LINE_PAY" | "OTHER";
// type PaymentType = "FULL" | "DEPOSIT" | "FINAL" | "INSTALLMENT" | "OTHER";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;           // ← 新增 onSuccess
  invoiceId: string;
  remainingAmount: number;          // ← 就是 balance
}

export default function AddPaymentModal({ open, onClose, onSuccess, invoiceId, remainingAmount }: Props) {
  const utils = api.useUtils();

  // 🟢 直接使用 tRPC mutation，不需從外部 import
  const createPayment = api.adminPayment.create.useMutation({
    onSuccess: () => {
      utils.adminInvoice.getById.invalidate({ id: invoiceId });
      utils.adminPayment.search.invalidate();
      onSuccess?.();
      onClose();
    },
  });

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      amount: remainingAmount,
      method: "CASH" as PaymentMethod,
      type: "FULL" as PaymentType,
      referenceNumber: "",
      paidAt: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const onSubmit = async (data: {
    amount: number;
    method: string;
    type: string;
    referenceNumber?: string;
    paidAt: string;
    note?: string;
  }) => {
    try {
      await createPayment.mutateAsync({
        invoiceId,
        amount: Number(data.amount),
        method: data.method as PaymentMethod,
        type: data.type as PaymentType,
        referenceNumber: data.referenceNumber || undefined,
        paidAt: new Date(data.paidAt),
        note: data.note || undefined,
      });
      // onSuccess / onClose 已在 mutation 的 onSuccess 中處理
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新增收款</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">金額</Label>
              <Input
                type="number"
                step="0.01"
                className="col-span-3"
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">付款方式</Label>
              <Select
                defaultValue="CASH"
                onValueChange={(val) => setValue("method", val as PaymentMethod)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="選擇付款方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">現金</SelectItem>
                  <SelectItem value="TRANSFER">轉帳</SelectItem>
                  <SelectItem value="CHECK">支票</SelectItem>
                  <SelectItem value="CREDIT_CARD">信用卡</SelectItem>
                  <SelectItem value="LINE_PAY">LINE Pay</SelectItem>
                  <SelectItem value="OTHER">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">收款類型</Label>
              <Select
                defaultValue="FULL"
                onValueChange={(val) => setValue("type", val as PaymentType)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL">全額</SelectItem>
                  <SelectItem value="DEPOSIT">訂金</SelectItem>
                  <SelectItem value="FINAL">尾款</SelectItem>
                  <SelectItem value="INSTALLMENT">分期</SelectItem>
                  <SelectItem value="OTHER">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">參考編號</Label>
              <Input className="col-span-3" {...register("referenceNumber")} placeholder="轉帳末五碼等" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">收款日期</Label>
              <Input type="date" className="col-span-3" {...register("paidAt")} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">備註</Label>
              <Input className="col-span-3" {...register("note")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={createPayment.isPending}>
              {createPayment.isPending ? "儲存中..." : "新增收款"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
