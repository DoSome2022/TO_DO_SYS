//src/app/admin/finance/quotations/[id]/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, FileText, Edit3, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuotationDetail } from "../../api";
import { StatusBadge } from "../../components/StatusBadge";
import { api } from "@/utils/api";
import QuotationToInvoiceModal from "../../components/QuotationToInvoiceModal";
import PrintQuotation from "../../components/PrintQuotation";
import QuotationEditModal from "../../components/QuotationEditModal";

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: quotation, isLoading, isError, error } = useQuotationDetail(id);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // ── 輔助函式：安全轉換 Decimal / number / null → number ──
  const toNumber = (val: unknown): number => {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "object" && val !== null && "toNumber" in val) {
      return (val as { toNumber(): number }).toNumber();
    }
    return Number(val);
  };



  console.log("-- Data -- : ", quotation , "-- End --")


  // 🟢 用 tRPC mutation 更新 totalAmount
  const utils = api.useUtils();
  const updateTotal = api.adminQuotation.updateTotalAmount.useMutation({
    onSuccess: () => {
      utils.adminQuotation.getById.invalidate({ id }); // 刷新數據
    },
  });

  // ── 計算每項明細的小計與總額（useMemo 避免每次 render 都重算） ──
  const calculatedItems = useMemo(() => {
    if (!quotation?.items || quotation.items.length === 0) return [];
    return quotation.items.map((item: any) => {
      const unitPrice = toNumber(item.unitPrice);
      const quantity = Number(item.quantity ?? 0);
      const subtotal = unitPrice * quantity;
      return { ...item, _subtotal: subtotal };
    });
  }, [quotation?.items]);

  const calculatedTotal = useMemo(() => {
    return calculatedItems.reduce((sum: number, item: any) => sum + item._subtotal, 0);
  }, [calculatedItems]);

  // 🟢 如果計算總額 ≠ DB 的 totalAmount，自動儲存（只執行一次）
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    const dbTotal = toNumber(quotation?.totalAmount);
    if (
      calculatedTotal > 0 &&
      Math.abs(calculatedTotal - dbTotal) > 0.01 && // 避免浮點數誤差
      !hasSynced &&
      !updateTotal.isPending
    ) {
      updateTotal.mutate({ id, totalAmount: calculatedTotal });
      setHasSynced(true);
    }
  }, [calculatedTotal, quotation?.totalAmount, hasSynced, updateTotal, id]);

  // 🟢 用計算總額覆蓋顯示（若已存回 DB，則 quotation.totalAmount 會更新）
  const displayTotal = calculatedTotal > 0
    ? calculatedTotal
    : toNumber(quotation?.totalAmount);


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
  if (isError || !quotation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <FileText size={48} className="opacity-40" />
          <p className="text-sm font-medium">無法載入報價單</p>
          <p className="text-xs text-zinc-400">
            {(error as unknown as Error)?.message ?? "報價單不存在或已被刪除"}
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

  // 格式化日期輔助
  const fmtDate = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const fmtAmount = (amount: number | { toNumber(): number } | null | undefined) => {
    if (amount == null) return "$ 0";
    const num = typeof amount === "number" ? amount : amount.toNumber();
    return `$ ${num.toLocaleString()}`;
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
            onClick={() => setShowConvertModal(true)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition",
              "border border-blue-300 dark:border-blue-700",
              "text-blue-700 dark:text-blue-400",
              "hover:bg-blue-50 dark:hover:bg-blue-900/20"
            )}
          >
            <RotateCcw size={16} /> 轉成收據
          </button>
            <button
              onClick={() => setShowEditModal(true)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition",
                "border border-zinc-300 dark:border-zinc-600",
                "text-zinc-600 dark:text-zinc-300",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <Edit3 size={16} /> 編輯
            </button>
          {/* <button
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition",
              "border border-zinc-300 dark:border-zinc-600",
              "text-zinc-600 dark:text-zinc-300",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <Printer size={16} /> 列印
          </button> */}
          {/* <button
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition",
              "hover:brightness-110 active:brightness-90"
            )}
            style={{ backgroundColor: "#0078D4" }}
          >
            <Download size={16} /> 匯出 PDF
          </button> */}
          <PrintQuotation quotationId={id} />
        </div>
      </div>

      {/* ── 主要卡片 ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
        {/* 標題列 */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-700">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {quotation.number ?? quotation.id}
              </h1>
              <StatusBadge status={quotation.status} />
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              {quotation.project?.title ?? "—"}
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {fmtAmount(displayTotal)}  {/* ✅ 改用 displayTotal */}
          </p>
        </div>

        {/* 內容 */}
        <div className="p-6 space-y-6">
          {/* 基本資訊網格 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <InfoField label="專案編號" value={quotation.project?.code ?? "—"} />
            <InfoField label="客戶名稱" value={quotation.customer?.name ?? "—"} />
            <InfoField label="公司抬頭" value={quotation.companyProfile?.name ?? "—"} />
            <InfoField label="業務" value={quotation.sales?.name ?? "—"} />
            <InfoField label="建立日期" value={fmtDate(quotation.createdAt)} />
            <InfoField label="有效期限" value={fmtDate(quotation.validUntil)} />
          </div>

          {/* 分隔線 */}
          <hr className="border-zinc-200 dark:border-zinc-700" />

                    {/* 報價明細表格 */}
          <div>
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              報價明細
            </h3>
            {/* ✅ 改用 calculatedItems */}
            {calculatedItems.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">
                        項次
                      </th>
                      <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">
                        品項名稱
                      </th>
                      <th className="text-right px-4 py-2.5 text-zinc-500 font-medium">
                        數量
                      </th>
                      <th className="text-right px-4 py-2.5 text-zinc-500 font-medium">
                        單價
                      </th>
                      <th className="text-right px-4 py-2.5 text-zinc-500 font-medium">
                        小計
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {calculatedItems.map((item: any, idx: number) => (
                      <tr
                        key={item.id ?? idx}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                      >
                        <td className="px-4 py-2.5 text-zinc-400">{idx + 1}</td>
                        <td className="px-4 py-2.5 text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </td>
                        <td className="px-4 py-2.5 text-right text-zinc-700 dark:text-zinc-300">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-right text-zinc-700 dark:text-zinc-300">
                          {fmtAmount(item.unitPrice)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-zinc-900 dark:text-zinc-100">
                          {fmtAmount(item._subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-50 dark:bg-zinc-800/50">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-2.5 text-right text-sm text-zinc-500 font-medium"
                      >
                        總計
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-blue-600">
                        {fmtAmount(displayTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">無明細資料</p>
            )}
          </div>


          {/* 備註 */}
          {quotation.note && (
            <>
              <hr className="border-zinc-200 dark:border-zinc-700" />
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  備註
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                  {quotation.note}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 關聯收據（如果有） ── */}
      {quotation.invoices && quotation.invoices.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-6">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            關聯收據
          </h2>
          <div className="space-y-3">
            {quotation.invoices.map((inv: any) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                onClick={() => router.push(`/admin/finance/invoices/${inv.id}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {inv.number ?? inv.id}
                  </span>
                  <StatusBadge status={inv.status} />
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {fmtAmount(inv.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showConvertModal && (
        <QuotationToInvoiceModal
          open={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          onSuccess={() => {
            utils.adminQuotation.getById.invalidate({ id });
          }}
          quotation={quotation}
        />
      )}

<QuotationEditModal
  open={showEditModal}
  onClose={() => setShowEditModal(false)}
  onSuccess={() => {
    utils.adminQuotation.getById.invalidate({ id });
  }}
  quotation={{
    id: quotation.id,
    title: quotation.title,
    note: quotation.note,
    validUntil: quotation.validUntil,
    items: quotation.items.map(item => ({
      id: item.id,
      name: item.customName ?? '',   // 將 customName 映射為 name
      quantity: item.quantity,
      unitPrice: item.unitPrice as number,
      description: item.serviceId,   // 如果 modal 需要 description
    })),
  }}
/>



    </div>
  );
}

// ── 輔助元件：資訊欄位 ──
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
