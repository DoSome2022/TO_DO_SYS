// src/app/admin/finance/invoices/[id]/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Printer, Download, Edit3, DollarSign, Loader2,FileOutput
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvoiceDetail } from "../../api";
import { api } from "@/utils/api";
import { useState } from "react";
import AddPaymentModal from "../../components/AddPaymentModal";
import InvoiceEditModal from "../../components/InvoiceEditModal";
import { useInvoicePrint } from "../../hooks/useInvoicePrint";
import { StatusBadge } from "../../components/StatusBadge";


export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: invoice, isLoading, isError, error } = useInvoiceDetail(id);
  const utils = api.useUtils();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);


  const { PrintPreview } = useInvoicePrint();



  // ── 列印 ──
  const onPrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  // ── 匯出 PDF (使用瀏覽器列印的「另存 PDF」) ──
  const onDownloadPDF = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  // ── 轉出尾款收據 ──
const createTailMutation = api.adminInvoice.createTailInvoice.useMutation({
  onSuccess: (newInvoice) => {
    utils.adminInvoice.getById.invalidate({ id });
    utils.adminInvoice.search.invalidate();
    // 可選擇跳轉到尾款收據頁
    // router.push(`/admin/finance/invoices/${newInvoice.id}`);
  },
  onError: (err) => {
    alert(err.message); // 可改用 toast
  },
});

const handleCreateTailInvoice = async () => {
  if (!confirm('確定要從此收據轉出尾款收據？\n系統會自動計算剩餘未收金額，產生一張新的尾款收據。')) return;
  try {
    await createTailMutation.mutateAsync({ invoiceId: id });
  } catch {
    // error handled by onError
  }
};


  // ── 輔助：安全轉換 Prisma Decimal (可能為 number 或 { toNumber() }) ──
  const toNumber = (val: any): number => {
    if (typeof val === "number") return val;
    if (val?.toNumber) return val.toNumber();
    return 0;
  };

  // ── 載入中 ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">載入中...</p>
        </div>
      </div>
    );
  }

  // ── 錯誤 ──
  if (isError || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <p className="text-sm font-medium">無法載入收據</p>
          <p className="text-xs text-zinc-400">
            {(error as unknown as Error)?.message ?? "收據不存在或已被刪除"}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  // ── 工具函式 ──
  const fmtDate = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("zh-TW", {
      year: "numeric", month: "2-digit", day: "2-digit",
    });
  };

  const fmtAmount = (amount: number | null | undefined) => {
    if (amount == null) return "$ 0";
    return `$ ${amount.toLocaleString()}`;
  };

  const paidAmount = invoice.paidAmount ?? 0;
  const totalAmount = invoice.totalAmount ?? 0;
  const balance = invoice.balance ?? 0;
  const itemsTotal = (invoice.items ?? []).reduce(
  (sum, item) => sum + toNumber(item.amount), 0
);   // ← 這行新增
  const paidPercent = totalAmount > 0
    ? Math.round((paidAmount / totalAmount) * 100)
    : 0;


console.log("-- Data --",invoice," -- End -- ");


  return (
    <>
      {/* ── 列印專用內容（隱藏在螢幕上） ── */}
      <div className="hidden print:block">
        <PrintPreview
          data={{
            invoiceNumber: invoice.invoiceNumber ?? "",
            status: invoice.status,
            projectCode: invoice.projectCode,
            projectName: invoice.projectName,
            customerName: invoice.customerName,
            companyName: invoice.companyName,
            issuedAt: invoice.issuedAt,
            dueDate: invoice.dueDate,
            salesName: invoice.salesName,
            totalAmount,
            paidAmount,
            balance,
            notes: invoice.notes,
            // ✅ items: 使用 router 回傳的欄位名稱 `amount`（不是 `subtotal`）
            items: (invoice.items ?? []).map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: toNumber(item.unitPrice),
              amount: toNumber(item.amount),   // ← router 回傳的是 amount
            })),
            // ✅ payments: 欄位名稱對應 hook 中的 PrintInvoiceData
            payments: (invoice.payments ?? []).map((p: any) => ({
              amount: toNumber(p.amount),
              type: p.paymentType ?? p.type,             // ← router 回傳 paymentType
              method: p.paymentMethod ?? p.method,        // ← router 回傳 paymentMethod
              paidAt: p.receivedAt ?? p.paidAt,           // ← router 回傳 receivedAt
            })),
          }}
        />
      </div>

      {/* ── 螢幕顯示內容 (列印時隱藏) ── */}
      <div className="space-y-6 max-w-4xl mx-auto print:hidden">
        {/* 頂部導航 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
          >
            <ArrowLeft size={16} />
            返回
          </button>
          <div className="flex items-center gap-2">
            {/* 新增收款 */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition",
                "border border-green-300 dark:border-green-700",
                "text-green-700 dark:text-green-400",
                "hover:bg-green-50 dark:hover:bg-green-900/20"
              )}
            >
              <DollarSign size={16} />
              新增收款
            </button>

            {/* 編輯 */}
            <button
              onClick={() => setShowEditModal(true)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition",
                "border border-zinc-300 dark:border-zinc-600",
                "text-zinc-600 dark:text-zinc-300",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <Edit3 size={16} />
              編輯
            </button>

            {/* 列印 */}
            <button
              onClick={onPrint}
              disabled={isPrinting}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition",
                "border border-zinc-300 dark:border-zinc-600",
                "text-zinc-600 dark:text-zinc-300",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                isPrinting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isPrinting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Printer size={16} />
              )}
              {isPrinting ? "列印中..." : "列印"}
            </button>

              {/* 轉出尾款收據 */}
              <button
                onClick={handleCreateTailInvoice}
                disabled={createTailMutation.isPending }
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition",
                  "border border-purple-300 dark:border-purple-700",
                  "text-purple-700 dark:text-purple-400",
                  "hover:bg-purple-50 dark:hover:bg-purple-900/20",
                  (createTailMutation.isPending ) && "opacity-50 cursor-not-allowed"
                )}
              >
                {createTailMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileOutput size={16} />
                )}
                {createTailMutation.isPending ? "轉出中..." : "轉出尾款收據"}
              </button>


            {/* 匯出 PDF */}
            <button
              onClick={onDownloadPDF}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition",
                "hover:brightness-110 active:brightness-90"
              )}
              style={{ backgroundColor: "#0078D4" }}
            >
              <Download size={16} />
              匯出 PDF
            </button>
          </div>
        </div>

        {/* ── 主要卡片 ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
          {/* 標題區 */}
          <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                  {invoice.invoiceNumber ?? "—"}
                </h1>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {invoice.projectName ?? "無專案名稱"}
                  {invoice.projectCode && (
                    <span className="ml-2 text-xs text-zinc-400">
                      ({invoice.projectCode})
                    </span>
                  )}
                </p>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          {/* 客戶 / 公司資訊 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div>
              <p className="text-xs text-zinc-400 mb-1">客戶名稱</p>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {invoice.customerName ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">公司抬頭</p>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {invoice.companyName ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">業務人員</p>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {invoice.salesName ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">關聯報價單</p>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {invoice.quotationNumber ?? "—"}
              </p>
            </div>
          </div>

          {/* 日期區 */}
          <div className="grid grid-cols-2 gap-6 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-xs text-zinc-400 mb-1">開立日期</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {fmtDate(invoice.issuedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">到期日期</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {fmtDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          {/* 明細表 */}
          <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                明細項目
              </h2>
              <span className="text-xs text-zinc-400">
                如需編輯明細，請至關聯報價單修改
              </span>
            </div>

            {(!invoice.items || invoice.items.length === 0) ? (
              <p className="text-sm text-zinc-400 py-4 text-center">無明細資料</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-2 text-xs text-zinc-400 font-medium w-10">#</th>
                      <th className="text-left py-2 text-xs text-zinc-400 font-medium">品項名稱</th>
                      <th className="text-right py-2 text-xs text-zinc-400 font-medium">數量</th>
                      <th className="text-right py-2 text-xs text-zinc-400 font-medium">單價</th>
                      <th className="text-right py-2 text-xs text-zinc-400 font-medium">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item: any, idx: number) => (
                      <tr
                        key={item.id ?? idx}
                        className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                      >
                        <td className="py-3 text-zinc-400">{idx + 1}</td>
                        <td className="py-3 text-zinc-700 dark:text-zinc-300">
                          {item.name}
                        </td>
                        <td className="py-3 text-right text-zinc-700 dark:text-zinc-300">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right text-zinc-700 dark:text-zinc-300">
                          {fmtAmount(toNumber(item.unitPrice))}
                        </td>
                        <td className="py-3 text-right font-medium text-zinc-800 dark:text-zinc-200">
                          {fmtAmount(toNumber(item.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-zinc-300 dark:border-zinc-600">
                      <td colSpan={4} className="py-3 text-right font-bold text-zinc-700 dark:text-zinc-300">
                        總計
                      </td>
                      <td className="py-3 text-right font-bold text-lg text-zinc-900 dark:text-zinc-100">
                        {fmtAmount(itemsTotal)}

                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* 金額總覽 */}
          <div className="grid grid-cols-3 gap-4 px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
              <p className="text-xs text-blue-500 dark:text-blue-400 mb-1">總金額</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-300">
                {fmtAmount(itemsTotal)}

              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
              <p className="text-xs text-green-500 dark:text-green-400 mb-1">已收款</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-300">
                {fmtAmount(paidAmount)}
              </p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-center">
              <p className="text-xs text-orange-500 dark:text-orange-400 mb-1">未收款</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-300">
                {fmtAmount(balance)}
              </p>
            </div>
          </div>

          {/* 進度條 */}
          {totalAmount > 0 && (
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-zinc-400">收款進度</span>
                <span className="text-xs font-medium text-zinc-500">{paidPercent}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    paidPercent >= 100
                      ? "bg-green-500"
                      : paidPercent > 0
                        ? "bg-blue-500"
                        : "bg-zinc-300 dark:bg-zinc-600"
                  )}
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* 收款紀錄 */}
          <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              收款紀錄
            </h2>

            {(!invoice.payments || invoice.payments.length === 0) ? (
              <p className="text-sm text-zinc-400 py-4 text-center">尚無收款紀錄</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-2 text-xs text-zinc-400 font-medium">收款日期</th>
                      <th className="text-left py-2 text-xs text-zinc-400 font-medium">類型</th>
                      <th className="text-left py-2 text-xs text-zinc-400 font-medium">方式</th>
                      <th className="text-right py-2 text-xs text-zinc-400 font-medium">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((p: any, idx: number) => (
                      <tr
                        key={p.id ?? idx}
                        className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                      >
                        <td className="py-3 text-zinc-700 dark:text-zinc-300">
                          {fmtDate(p.paidAt ?? p.receivedAt ?? p.createdAt)}
                        </td>
                        <td className="py-3">
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {p.paymentType ?? p.type ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-700 dark:text-zinc-300">
                          {p.paymentMethod ?? p.method ?? "—"}
                        </td>
                        <td className="py-3 text-right font-medium text-green-600 dark:text-green-400">
                          + {fmtAmount(toNumber(p.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 備註 */}
          <div className="px-6 py-5">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              備註
            </h2>
            {invoice.notes ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                {invoice.notes}
              </p>
            ) : (
              <p className="text-sm text-zinc-400 italic">無備註</p>
            )}
          </div>
        </div>


      </div>

      {/* ── Modals ── */}
      {showEditModal && invoice && (
        <InvoiceEditModal
          open={showEditModal}
          invoice={invoice}
          itemsTotal={itemsTotal}   // ← 加上這行
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            utils.adminInvoice.getById.invalidate({ id });
            utils.adminInvoice.search.invalidate();   // ← 加上這行
          }}
        />
      )}

      {showPaymentModal && (
        <AddPaymentModal
          open={showPaymentModal}
          invoiceId={id}
          remainingAmount={balance}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            utils.adminInvoice.getById.invalidate({ id });
            utils.adminInvoice.search.invalidate();   // ← 加上這行，讓列表也更新
          }}
        />
      )}
    </>
  );
}
