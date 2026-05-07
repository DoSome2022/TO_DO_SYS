"use client";

import { useRef, useState, useEffect } from "react";
import { Printer, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";

// ── 輔助函式 ──
const toNumber = (val: unknown): number => {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null && "toNumber" in val) {
    return (val as { toNumber(): number }).toNumber();
  }
  return Number(val);
};

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const fmtAmount = (val: unknown) => {
  const num = toNumber(val);
  return `$ ${num.toLocaleString()}`;
};

interface Props {
  quotationId: string;
  accentColor?: string;
}

export default function PrintQuotation({ quotationId, accentColor = "#0078D4" }: Props) {
  // 🟢 使用 tRPC 查詢來獲取列印用資料（確保最新）
  const { data: quotation, isLoading, isError } = api.adminQuotation.getById.useQuery(
    { id: quotationId },
    { enabled: !!quotationId }
  );

  const printRef = useRef<HTMLDivElement>(null);
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  // ── 計算明細與總額 ──
  const calculatedItems = (quotation?.items ?? []).map((item: any) => {
    const unitPrice = toNumber(item.unitPrice);
    const quantity = Number(item.quantity ?? 0);
    return { ...item, _subtotal: unitPrice * quantity };
  });

  const totalAmount = calculatedItems.reduce((sum: number, item: any) => sum + item._subtotal, 0);

  // ── 瀏覽器列印 ──
  const handlePrint = () => {
    setIsPrintPreview(true);
    // 等 React 渲染完成後再列印
    setTimeout(() => {
      window.print();
      setIsPrintPreview(false);
    }, 300);
  };

  // ── 下載 PDF（透過列印 → 另存 PDF） ──
  const handleDownloadPDF = () => {
    setIsPrintPreview(true);
    setTimeout(() => {
      window.print();
      // 使用者需在列印對話框中選擇「另存為 PDF」
      setIsPrintPreview(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <div className="w-4 h-4 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
        載入中...
      </div>
    );
  }

  if (isError || !quotation) {
    return <span className="text-sm text-red-400">無法載入報價單資料</span>;
  }

  return (
    <>
      {/* ── 列印工具列 ── */}
      <div className="no-print flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition",
            "border border-zinc-300 dark:border-zinc-600",
            "text-zinc-600 dark:text-zinc-300",
            "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          )}
        >
          <Printer size={16} /> 列印
        </button>
        <button
          type="button"
          onClick={handleDownloadPDF}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition",
            "hover:brightness-110 active:brightness-90"
          )}
          style={{ backgroundColor: accentColor }}
        >
          <Download size={16} /> 匯出 PDF
        </button>
      </div>

      {/* ── 列印預覽遮罩 ── */}
      {isPrintPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 no-print">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md text-center">
            <Printer size={48} className="mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">正在準備列印...</h3>
            <p className="text-sm text-zinc-500 mb-4">
              列印對話框開啟後，您也可以選擇「另存為 PDF」
            </p>
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}

      {/* ── 列印內容 ── */}
      <div ref={printRef} className="print-content" style={{ display: isPrintPreview ? "block" : "none" }}>
        <div className="max-w-[210mm] mx-auto bg-white p-[15mm] font-sans text-sm">
          {/* 標題 */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">報價單</h1>
              <p className="text-zinc-500 mt-1">{quotation.number ?? quotation.id}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">{fmtAmount(totalAmount)}</p>
            </div>
          </div>

          {/* 基本資訊 */}
          <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-zinc-50 rounded-lg">
            <div>
              <p className="text-xs text-zinc-400">客戶名稱</p>
              <p className="text-sm font-medium">{quotation.customer?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">公司抬頭</p>
              <p className="text-sm font-medium">{quotation.companyProfile?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">業務</p>
              <p className="text-sm font-medium">{quotation.sales?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">有效期限</p>
              <p className="text-sm font-medium">{fmtDate(quotation.validUntil)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">建立日期</p>
              <p className="text-sm font-medium">{fmtDate(quotation.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">專案編號</p>
              <p className="text-sm font-medium">{quotation.project?.code ?? "—"}</p>
            </div>
          </div>

          {/* 明細表格 */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="border-b-2 border-zinc-300">
                <th className="text-left py-2 text-xs font-semibold text-zinc-500 w-[40px]">項次</th>
                <th className="text-left py-2 text-xs font-semibold text-zinc-500">品項名稱</th>
                <th className="text-right py-2 text-xs font-semibold text-zinc-500 w-[80px]">數量</th>
                <th className="text-right py-2 text-xs font-semibold text-zinc-500 w-[100px]">單價</th>
                <th className="text-right py-2 text-xs font-semibold text-zinc-500 w-[100px]">小計</th>
              </tr>
            </thead>
            <tbody>
              {calculatedItems.map((item: any, idx: number) => (
                <tr key={item.id ?? idx} className="border-b border-zinc-100">
                  <td className="py-2 text-zinc-400">{idx + 1}</td>
                  <td className="py-2 text-zinc-900">{item.name}</td>
                  <td className="py-2 text-right text-zinc-700">{item.quantity}</td>
                  <td className="py-2 text-right text-zinc-700">{fmtAmount(item.unitPrice)}</td>
                  <td className="py-2 text-right font-medium text-zinc-900">{fmtAmount(item._subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="py-3 text-right text-sm font-semibold text-zinc-500">總計</td>
                <td className="py-3 text-right font-bold text-lg text-blue-600">{fmtAmount(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* 備註 */}
          {quotation.note && (
            <div className="mt-6 p-4 bg-zinc-50 rounded-lg">
              <p className="text-xs text-zinc-400 mb-1">備註</p>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">{quotation.note}</p>
            </div>
          )}

          {/* 頁尾 */}
          <div className="mt-12 text-center text-xs text-zinc-400 border-t border-zinc-200 pt-4">
            <p>此為系統產生之報價單，請核對後簽名確認</p>
            <p className="mt-1">產生日期：{new Date().toLocaleDateString("zh-TW")}</p>
          </div>
        </div>
      </div>

      {/* ── Print Styles ── */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0;
            size: A4;
          }
        }
      `}</style>
    </>
  );
}
