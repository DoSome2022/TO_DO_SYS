"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Edit3, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePaymentDetail } from "../../api";

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: payment, isLoading, isError, error } = usePaymentDetail(id);

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
  if (isError || !payment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <p className="text-sm font-medium">無法載入付款紀錄</p>
          <p className="text-xs text-zinc-400">
            {error?.message ?? "付款紀錄不存在或已被刪除"}
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

  const fmtDate = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("zh-TW", {
      year: "numeric", month: "2-digit", day: "2-digit",
    });
  };

  const fmtDateTime = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("zh-TW", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const fmtAmount = (amount: number | { toNumber(): number } | null | undefined) => {
    if (amount == null) return "NT$ 0";
    const num = typeof amount === "number" ? amount : amount.toNumber();
    return `NT$ ${num.toLocaleString()}`;
  };

  // 付款方式標籤
  const methodLabel: Record<string, string> = {
    CASH: "現金",
    TRANSFER: "銀行轉帳",
    CHECK: "支票",
    CREDIT_CARD: "信用卡",
    LINE_PAY: "Line Pay",
    OTHER: "其他",
  };

  const typeLabel: Record<string, string> = {
    DOWN_PAYMENT: "訂金",
    MILESTONE: "里程碑款",
    FINAL: "尾款",
    FULL: "全額付款",
  };

  const methodColor: Record<string, string> = {
    CASH: "#107C10",
    TRANSFER: "#0078D4",
    CHECK: "#FF8C00",
    CREDIT_CARD: "#D83B01",
    LINE_PAY: "#00C853",
    OTHER: "#666666",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── 頂部導航 ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
        >
          <ArrowLeft size={16} />
          返回
        </button>
        <div className="flex items-center gap-2">
          <button
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
          <button
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition",
              "border border-zinc-300 dark:border-zinc-600",
              "text-zinc-600 dark:text-zinc-300",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <Printer size={16} />
            列印
          </button>
          <button
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
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
        {/* 標題列 */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-700">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                付款紀錄
              </h1>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: methodColor[payment.method] ?? "#666" }}
              >
                {methodLabel[payment.method] ?? payment.method}
              </span>
            </div>
            {payment.invoice && (
              <p className="text-sm text-zinc-500 mt-1">
                關聯收據：{payment.invoice.invoiceNo}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-600">
              {fmtAmount(payment.amount)}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {typeLabel[payment.type] ?? payment.type}
            </p>
          </div>
        </div>

        {/* 內容 */}
        <div className="p-6 space-y-6">
          {/* 資訊網格 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <InfoField label="付款方式" value={methodLabel[payment.method] ?? payment.method} />
            <InfoField label="付款類型" value={typeLabel[payment.type] ?? payment.type} />
            <InfoField label="付款日期" value={fmtDate(payment.paidAt)} />
            <InfoField label="建立時間" value={fmtDateTime(payment.createdAt)} />
            {payment.payerName && (
              <InfoField label="付款人" value={payment.payerName} />
            )}
          </div>

          {/* 備註 */}
          {payment.note && (
            <>
              <hr className="border-zinc-200 dark:border-zinc-700" />
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">備註</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                  {payment.note}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 關聯收據資訊 ── */}
      {payment.invoice && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-6">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            關聯收據
          </h2>
          <div
            className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            onClick={() => router.push(`/admin/finance/invoices/${payment.invoice?.id}`)}

          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Receipt size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {payment.invoice.invoiceNo}
                </p>
                <p className="text-xs text-zinc-400">
                  {payment.invoice.project?.title ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-zinc-500">
                  總額：{fmtAmount(payment.invoice.totalAmount)}
                </p>
              </div>
              <span className="text-xs text-blue-500 hover:text-blue-700">查看 →</span>
            </div>
          </div>

          {/* 該收據的其他付款紀錄 */}
          {payment.invoice.payments && payment.invoice.payments.length > 1 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
                同一收據的其他付款
              </h3>
              <div className="space-y-2">
                {payment.invoice.payments
                  .filter((p: { id: string }) => p.id !== payment.id)
                  .map((otherPayment: { id: string; amount: number; type: string; paidAt: Date }) => (
                    <div
                      key={otherPayment.id}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition cursor-pointer"
                      onClick={() => router.push(`/admin/finance/payments/${otherPayment.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {fmtAmount(otherPayment.amount)}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {typeLabel[otherPayment.type] ?? otherPayment.type}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {fmtDate(otherPayment.paidAt)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
