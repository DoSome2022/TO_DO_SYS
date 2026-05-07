// src/app/admin/finance/components/FinanceSearchBar.tsx

"use client";

import { useState, useCallback } from "react";
import { Search, X, Filter, Calendar, DollarSign, Hash, User, Building2, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 輔助元件：單一篩選欄位 ──
function FilterField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

// ── 可複用的 input 樣式 ──
const filterInputClass = cn(
  "w-full px-2.5 py-2 bg-white dark:bg-zinc-800",
  "border border-zinc-300 dark:border-zinc-600 rounded-md text-sm",
  "focus:outline-none focus:ring-2 focus:border-transparent",
  "transition-shadow"
);

// ── Props ──
interface SearchField {
  label: string;
  value: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

interface FinanceSearchBarProps {
  onSearch: (filters: Record<string, string>) => void;
  fields?: ("date" | "amount" | "keyword" | "projectCode" | "sales" | "customer" | "company")[];
  extraFilters?: React.ReactNode;
  accentColor?: string;
}

// ── 主元件 ──
export function FinanceSearchBar({
  onSearch,
  fields = ["date", "amount", "keyword", "projectCode", "sales", "customer", "company"],
  extraFilters,
  accentColor = "#0078D4",
}: FinanceSearchBarProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(filters);
    },
    [filters, onSearch]
  );

  const handleClear = useCallback(() => {
    setFilters({});
    onSearch({});
  }, [onSearch]);

  const handleResetAdvanced = useCallback(() => {
    setFilters({});
  }, []);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: "1", label: "1月" },
    { value: "2", label: "2月" },
    { value: "3", label: "3月" },
    { value: "4", label: "4月" },
    { value: "5", label: "5月" },
    { value: "6", label: "6月" },
    { value: "7", label: "7月" },
    { value: "8", label: "8月" },
    { value: "9", label: "9月" },
    { value: "10", label: "10月" },
    { value: "11", label: "11月" },
    { value: "12", label: "12月" },
  ];

  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* ── 主要搜尋行 ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 搜尋框 */}
        <div className="relative flex-1 min-w-[240px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={18}
            style={{ color: accentColor }}
          />
          <input
            type="text"
            placeholder="搜尋編號、名稱..."
            value={filters.keyword ?? ""}
            onChange={(e) => handleChange("keyword", e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2.5",
              "bg-white dark:bg-zinc-800",
              "border border-zinc-300 dark:border-zinc-600 rounded-lg",
              "text-sm text-zinc-900 dark:text-zinc-100",
              "placeholder:text-zinc-400",
              "focus:outline-none focus:ring-2 focus:border-transparent",
              "transition-shadow"
            )}
            style={
              { "--tw-ring-color": accentColor } as React.CSSProperties
            }
          />
          {filters.keyword && (
            <button
              type="button"
              onClick={() => handleChange("keyword", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 進階篩選按鈕 */}
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm transition",
            "border",
            showAdvanced
              ? "bg-zinc-200 dark:bg-zinc-700 border-zinc-400 dark:border-zinc-500 text-zinc-800 dark:text-zinc-200"
              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          )}
        >
          <Filter size={16} />
          進階篩選
        </button>

        {/* 搜尋按鈕 */}
        <button
          type="submit"
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-medium text-white",
            "transition hover:brightness-110 active:brightness-90"
          )}
          style={{ backgroundColor: accentColor }}
        >
          搜尋
        </button>

        {/* 清除篩選 */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
          >
            清除篩選
          </button>
        )}
      </div>

      {/* ── 進階篩選面板 ── */}
      {showAdvanced && (
        <div
          className={cn(
            "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 p-4",
            "bg-white dark:bg-zinc-800/50",
            "border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm"
          )}
        >
          {/* 年份 */}
          {fields.includes("date") && (
            <FilterField icon={<Calendar size={12} />} label="年份">
              <select
                value={filters.year ?? ""}
                onChange={(e) => handleChange("year", e.target.value)}
                className={filterInputClass}
                style={
                  { "--tw-ring-color": accentColor } as React.CSSProperties
                }
              >
                <option value="">全部</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}年
                  </option>
                ))}
              </select>
            </FilterField>
          )}

          {/* 月份 */}
          {fields.includes("date") && (
            <FilterField icon={<Calendar size={12} />} label="月份">
              <select
                value={filters.month ?? ""}
                onChange={(e) => handleChange("month", e.target.value)}
                className={filterInputClass}
                style={
                  { "--tw-ring-color": accentColor } as React.CSSProperties
                }
              >
                <option value="">全部</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </FilterField>
          )}

          {/* 日期 */}
          {fields.includes("date") && (
            <FilterField icon={<Calendar size={12} />} label="日期">
              <input
                type="number"
                min={1}
                max={31}
                placeholder="日"
                value={filters.day ?? ""}
                onChange={(e) => handleChange("day", e.target.value)}
                className={filterInputClass}
                style={
                  { "--tw-ring-color": accentColor } as React.CSSProperties
                }
              />
            </FilterField>
          )}

          {/* 最低金額 */}
          {fields.includes("amount") && (
            <FilterField icon={<DollarSign size={12} />} label="最低金額">
              <input
                type="number"
                placeholder="$ 0"
                value={filters.minAmount ?? ""}
                onChange={(e) => handleChange("minAmount", e.target.value)}
                className={filterInputClass}
                style={
                  { "--tw-ring-color": accentColor } as React.CSSProperties
                }
              />
            </FilterField>
          )}

          {/* 最高金額 */}
          {fields.includes("amount") && (
            <FilterField icon={<DollarSign size={12} />} label="最高金額">
              <input
                type="number"
                placeholder="$ 999,999"
                value={filters.maxAmount ?? ""}
                onChange={(e) => handleChange("maxAmount", e.target.value)}
                className={filterInputClass}
                style={
                  { "--tw-ring-color": accentColor } as React.CSSProperties
                }
              />
            </FilterField>
          )}

          {/* 專案編號 */}
          {fields.includes("projectCode") && (
            <FilterField icon={<Hash size={12} />} label="專案編號">
              <input
                type="text"
                placeholder="PRJ-2026-001"
                value={filters.projectCode ?? ""}
                onChange={(e) => handleChange("projectCode", e.target.value)}
                className={filterInputClass}
                style={
                  { "--tw-ring-color": accentColor } as React.CSSProperties
                }
              />
            </FilterField>
          )}

          {/* 業務 */}
          {fields.includes("sales") && (
            <FilterField icon={<User size={12} />} label="業務">
              <input
                type="text"
                placeholder="業務姓名"
                value={filters.salesName ?? ""}
                onChange={(e) => handleChange("salesName", e.target.value)}
                className={filterInputClass}
                style={
                  { "--tw-ring-color": accentColor } as React.CSSProperties
                }
              />
            </FilterField>
          )}

          {/* 客戶 */}
          {fields.includes("customer") && (
            <FilterField icon={<Building2 size={12} />} label="客戶">
              <input
                type="text"
                placeholder="客戶名稱"
                value={filters.customerName ?? ""}
                onChange={(e) => handleChange("customerName", e.target.value)}
                className={filterInputClass}
                style={
                  { "--tw-ring-color": accentColor } as React.CSSProperties
                }
              />
            </FilterField>
          )}

          {/* 公司抬頭 */}
          {fields.includes("company") && (
            <FilterField icon={<Briefcase size={12} />} label="公司抬頭">
              <input
                type="text"
                placeholder="公司名稱"
                value={filters.companyName ?? ""}
                onChange={(e) => handleChange("companyName", e.target.value)}
                className={filterInputClass}
                style={
                  { "--tw-ring-color": accentColor } as React.CSSProperties
                }
              />
            </FilterField>
          )}

          {/* 重置面板按鈕（在最底下全寬） */}
          {hasActiveFilters && (
            <div className="col-span-full flex justify-end pt-1">
              <button
                type="button"
                onClick={handleResetAdvanced}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline transition"
              >
                重置所有篩選
              </button>
            </div>
          )}
        </div>
      )}

      {/* 額外 filters */}
      {extraFilters && (
        <div className="flex items-center gap-2 flex-wrap">{extraFilters}</div>
      )}
    </form>
  );
}
