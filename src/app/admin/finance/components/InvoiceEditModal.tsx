// src/app/admin/finance/components/InvoiceEditModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { api } from "@/utils/api";
import type { RouterOutputs } from "@/utils/api";

type InvoiceDetail = RouterOutputs["adminInvoice"]["getById"];

interface InvoiceEditModalProps {
  open: boolean;
  invoice: InvoiceDetail;
  itemsTotal: number; 
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  dueDate: string;
  notes: string;
}

export default function InvoiceEditModal({
  open,
  invoice,
  itemsTotal,
  onClose,
  onSuccess,
}: InvoiceEditModalProps) {
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    reset,
    formState: {  isSubmitting },
  } = useForm<FormValues>();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 初始化表單資料
  useEffect(() => {
    if (invoice) {
      reset({
        dueDate: invoice.dueDate
          ? new Date(invoice.dueDate).toISOString().slice(0, 10)
          : "",
        notes: invoice.notes ?? "",
      });
    }
  }, [invoice, reset]);

  // ── tRPC Mutation ──
const updateInvoice = api.adminInvoice.update.useMutation({
  onSuccess: () => {
    utils.adminInvoice.getById.invalidate({ id: invoice.id });
    onClose();
  },
});


const onSubmit = async (formData: FormValues) => {
  try {
    setErrorMsg(null);
    await updateInvoice.mutateAsync({
      id: invoice.id,
      ...(formData.dueDate ? { dueDate: new Date(formData.dueDate) } : {}),
      notes: formData.notes,
    });
  } catch (err) {
    setErrorMsg(err instanceof Error ? err.message : '更新失敗');
  }
};

  // 格式化金額
  const fmtMoney = (n: number) => `$ ${n.toLocaleString()}`;

//   const toNumber = (val: any): number => {
//   if (typeof val === "number") return val;
//   if (val?.toNumber) return val.toNumber();
//   return 0;
// };

  if (!open) return null;
  {errorMsg && (
  <p className="text-sm text-red-500">{errorMsg}</p>
)}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* 標題列 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold">編輯收據</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* 唯讀資訊 */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-400">收據編號</p>
              <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">客戶</p>
              <p className="text-sm font-medium">{invoice.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">專案</p>
              <p className="text-sm font-medium">{invoice.projectName || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">總金額</p>
              <p className="text-sm font-medium">{fmtMoney(itemsTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">已收款</p>
              <p className="text-sm font-medium text-green-600">{fmtMoney(invoice.paidAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">未收款</p>
              <p className="text-sm font-medium text-orange-600">{fmtMoney(invoice.balance)}</p>
            </div>
          </div>

          {/* 可編輯欄位 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">到期日期</label>
              <input
                type="date"
                {...register("dueDate")}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 明細項目（唯讀） */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-500 font-medium">收據明細</label>
            </div>

            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-3 py-2 text-xs text-zinc-500">品項</th>
                    <th className="text-right px-3 py-2 text-xs text-zinc-500">數量</th>
                    <th className="text-right px-3 py-2 text-xs text-zinc-500">單價</th>
                    <th className="text-right px-3 py-2 text-xs text-zinc-500">小計</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, idx) => (
                    <tr key={item.id || idx} className="border-b border-zinc-100">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">{fmtMoney(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-medium">{fmtMoney(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              ⚠️ 明細項目來自關聯的報價單，如需修改請至報價單編輯
            </p>
          </div>

          {/* 備註 */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">備註</label>
            <textarea
              {...register("notes")}
              rows={3}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting }
              className="px-6 py-2 text-sm rounded-lg text-white font-medium flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#0078D4" }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              儲存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
