// src/app/admin/finance/invoices/page.tsx

"use client";

import { Suspense, useState } from "react";
import { Plus, Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvoiceSearch } from "../api";
import { useInvoiceFilters } from "../hooks/useInvoiceFilters";
import { FinanceSearchBar } from "../components/FinanceSearchBar";
import { InvoiceTable } from "../components/InvoiceTable";
import { InvoiceCreateForm } from "../components/InvoiceCreateForm";
import type { InvoiceStatus } from "../types";

const STATUS_OPTIONS: { value: InvoiceStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "全部狀態" },
  { value: "UNPAID", label: "未付款" },
  { value: "PARTIAL", label: "部分付款" },
  { value: "PAID", label: "已付款" },
  { value: "CANCELLED", label: "已取消" },
];

const BALANCE_OPTIONS: { value: boolean | null; label: string }[] = [
  { value: null, label: "全部" },
  { value: true, label: "有未收尾款" },
  { value: false, label: "已結清" },
];

function InvoicesPageContent() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {
    searchParams,
    statusFilter,
    hasBalanceFilter,
    handleSearch,
    handleStatusChange,
    handleBalanceFilterChange,
    handlePageChange,
  } = useInvoiceFilters();

  // ── 查詢資料 ──
  const { data, isLoading, isError, error } = useInvoiceSearch(searchParams);

  console.log("-- Data -- :", data, "-- End --");

  // ── 狀態篩選器（作為 extraFilters 傳給 SearchBar） ──
  const statusExtraFilters = (
    <>
      {/* 狀態下拉 */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500 whitespace-nowrap">狀態：</label>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value as InvoiceStatus | "ALL")}
          className={cn(
            "px-3 py-2 bg-white dark:bg-zinc-800",
            "border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "transition-shadow"
          )}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 未收尾款篩選 */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500 whitespace-nowrap">尾款：</label>
        <select
          value={String(hasBalanceFilter)}
          onChange={(e) => {
            const val = e.target.value;
            handleBalanceFilterChange(val === "null" ? null : val === "true");
          }}
          className={cn(
            "px-3 py-2 bg-white dark:bg-zinc-800",
            "border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "transition-shadow"
          )}
        >
          {BALANCE_OPTIONS.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {/* ── 頁面標題 + 操作按鈕 ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">收據管理</h1>
          <p className="text-sm text-zinc-500 mt-1">管理所有已開立的收據與收款狀態</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 列印 / 匯出（預留） */}
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
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition",
              "border border-zinc-300 dark:border-zinc-600",
              "text-zinc-600 dark:text-zinc-300",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <Download size={16} />
            匯出
          </button>
          {/* 新增收據 */}
          <button
            onClick={() => setShowCreateModal(true)}
            className={cn(
              "flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white transition",
              "hover:brightness-110 active:brightness-90"
            )}
            style={{ backgroundColor: "#0078D4" }}
          >
            <Plus size={18} />
            新增收據
          </button>
        </div>
      </div>

      {/* ── 搜尋列 ── */}
      <FinanceSearchBar
        onSearch={handleSearch}
        fields={["date", "amount", "keyword", "projectCode", "sales", "customer", "company"]}
        extraFilters={statusExtraFilters}
      />

      {/* ── 統計摘要列 ── */}
      {data && !isLoading && (
        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <span>
            共 <strong className="text-zinc-800 dark:text-zinc-200">{data.total}</strong> 筆收據
          </span>
          <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-600" />
          <span>
            第 <strong className="text-zinc-800 dark:text-zinc-200">{data.page}</strong> /
            <strong className="text-zinc-800 dark:text-zinc-200">{data.totalPages}</strong> 頁
          </span>
        </div>
      )}

      {/* ── 表格區 ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">載入中...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2 text-red-500">
            <p className="text-sm font-medium">載入失敗</p>
            <p className="text-xs text-zinc-400">
              {(error as unknown as Error)?.message ?? "請稍後再試"}
            </p>
          </div>
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <p className="text-base">尚無資料</p>
            <p className="text-xs">目前沒有符合條件的收據紀錄</p>
          </div>
        </div>
      ) : data ? (
        <>
          <InvoiceTable data={data} accentColor="#0078D4" />

          {/* ── 分頁 ── */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={data.page <= 1}
                onClick={() => handlePageChange(data.page - 1)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg transition",
                  "border border-zinc-300 dark:border-zinc-600",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                上一頁
              </button>
              {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
                const start = Math.max(1, data.page - 3);
                const pageNum = start + i;
                if (pageNum > data.totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      "w-8 h-8 text-sm rounded-lg transition",
                      pageNum === data.page
                        ? "text-white"
                        : "border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    )}
                    style={
                      pageNum === data.page
                        ? { backgroundColor: "#0078D4" }
                        : undefined
                    }
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                disabled={data.page >= data.totalPages}
                onClick={() => handlePageChange(data.page + 1)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg transition",
                  "border border-zinc-300 dark:border-zinc-600",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                下一頁
              </button>
            </div>
          )}
        </>
      ) : null}

      {/* ── 新增收據 Modal ── */}
      <InvoiceCreateForm
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          handleSearch({});
        }}
      />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">載入中...</p>
          </div>
        </div>
      }
    >
      <InvoicesPageContent />
    </Suspense>
  );
}
