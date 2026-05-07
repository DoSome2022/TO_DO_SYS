//src/app/admin/finance/components/QuotationTable.tsx

"use client";

import Link from "next/link";
import type { QuotationSearchResult } from "../types";

// 微軟風格的狀態標籤
const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", dot: "bg-zinc-400" },
  NEGOTIATING: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  WON: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" },
  LOST: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
};

const statusLabels: Record<string, string> = {
  DRAFT: "草稿",
  NEGOTIATING: "交涉中",
  WON: "已成交",
  LOST: "已流失",
};

interface QuotationTableProps {
  data: QuotationSearchResult | undefined;
  isLoading: boolean;
}

export function QuotationTable({ data, isLoading }: QuotationTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-400">
        <p className="text-lg">找不到符合條件的報價單</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">標題</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">狀態</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">客戶</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">業務</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">專案編號</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">金額</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">日期</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
          {data.items.map((item) => {
            const style = statusStyles[item.status] ?? statusStyles.DRAFT;
            return (
              <tr
                key={item.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
                onClick={() => window.location.href = `/admin/finance/quotations/${item.id}`}
              >
                <td className="px-4 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {statusLabels[item.status] ?? item.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {item.customer?.companyname ?? item.customer?.name ?? "-"}
                </td>
                <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {item.sales?.name ?? "-"}
                </td>
                <td className="px-4 py-4 text-sm font-mono text-zinc-500">
                  {item.project?.code ?? "-"}
                </td>
                <td className="px-4 py-4 text-sm text-right font-medium text-zinc-900 dark:text-zinc-100">
                  $ {Number(item.customerPrice ?? item.totalAmount).toLocaleString()}
                </td>
                <td className="px-4 py-4 text-sm text-right text-zinc-400">
                  {new Date(item.createdAt).toLocaleDateString("zh-TW")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 分頁（微軟風格） */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
          <span className="text-sm text-zinc-500">
            共 {data.total} 筆，第 {data.page}/{data.totalPages} 頁
          </span>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(data.totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <Link
                  key={pageNum}
                  href={`?page=${pageNum}`}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    pageNum === data.page
                      ? "bg-[#0078D4] text-white"
                      : "text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
