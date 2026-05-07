"use client";

import { TrendingUp, TrendingDown, DollarSign, Receipt, FileText, AlertCircle } from "lucide-react";
import { useInvoiceSummary, useQuotationSummary } from "./api";
import { cn } from "@/lib/utils";

// ── 輔助函式：將 Decimal / number / string 統一轉成顯示字串 ──
function formatFinanceValue(
  value: number | string | { toNumber(): number } | null | undefined,
  prefix = "",
  suffix = ""
): string {
  if (value == null) return `${prefix} 0 ${suffix}`.trim();
  if (typeof value === "number") return `${prefix} ${value.toLocaleString()} ${suffix}`.trim();
  if (typeof value === "string") return `${prefix} ${value} ${suffix}`.trim();
  // Decimal 型別：有 toNumber() 方法
  return `${prefix} ${value.toNumber().toLocaleString()} ${suffix}`.trim();
}

export default function FinanceOverviewPage() {
  const currentYear = new Date().getFullYear();
  const { data: invoiceSummary, isLoading: invLoading } = useInvoiceSummary(currentYear);
  const { data: quotationSummary, isLoading: quoLoading } = useQuotationSummary(currentYear);

  const cards = [
    {
      title: "本年度營收",
      value: invoiceSummary?.totalRevenue,
      prefix: "NT$",
      icon: DollarSign,
      color: "#0078D4",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "未收尾款總額",
      value: invoiceSummary?.outstandingBalance,
      prefix: "NT$",
      icon: AlertCircle,
      color: "#D83B01",
      trend: "需追蹤",
      trendUp: false,
    },
    {
      title: "部分付款案件",
      value: invoiceSummary?.partialPaymentCount,
      suffix: "件",
      icon: Receipt,
      color: "#FF8C00",
    },
    {
      title: "已成交報價單",
      value: quotationSummary?.wonQuotations,
      suffix: ` / ${quotationSummary?.totalQuotations ?? 0} 總單`,
      icon: FileText,
      color: "#107C10",
      subtitle: `成交率 ${(quotationSummary?.winRate ?? 0).toFixed(1)}%`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={cn(
                "bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700",
                "p-5 shadow-sm hover:shadow-md transition-shadow"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{card.title}</p>
                  <p className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">
                    {formatFinanceValue(card.value, card.prefix, card.suffix)}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs text-zinc-400 mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <Icon size={20} style={{ color: card.color }} />
                </div>
              </div>
              {card.trend && (
                <div className="flex items-center gap-1 mt-3">
                  {card.trendUp ? (
                    <TrendingUp size={14} className="text-green-500" />
                  ) : (
                    <TrendingDown size={14} className="text-red-500" />
                  )}
                  <span className={`text-xs ${card.trendUp ? "text-green-600" : "text-red-600"}`}>
                    {card.trend}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 快速連結區塊（保持不變） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/admin/finance/quotations"
                    className={cn(
            "flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl",
            "border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition group"
          )}
        >
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition">
            <FileText size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">查看報價單</p>
            <p className="text-sm text-zinc-500">瀏覽所有報價單與成交狀態</p>
          </div>
        </a>

        <a
          href="/admin/finance/invoices"
          className={cn(
  "flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl",
  "border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition group"
)}
        >
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition">
            <Receipt size={24} className="text-green-600" />
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">查看收據</p>
            <p className="text-sm text-zinc-500">管理已開立的收據與收款狀態</p>
          </div>
        </a>

        {/* <a
          href="/admin/finance/payments"
          className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 
                     dark:border-zinc-700 hover:shadow-md transition group"
        >
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition">
            <DollarSign size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">追蹤尾款</p>
            <p className="text-sm text-zinc-500">查看尚未收齊的款項與收款紀錄</p>
          </div>
        </a> */}
      </div>
    </div>
  );
}
