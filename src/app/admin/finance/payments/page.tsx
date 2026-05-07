"use client";

import { useState } from "react";

import { AlertCircle } from "lucide-react";
import { FinanceSearchParams } from "../types";
import { usePaymentSearch } from "../api";
import { FinanceSearchBar } from "../components/FinanceSearchBar";

export default function AdminPaymentsPage() {
  const [params, setParams] = useState<FinanceSearchParams & { paymentType?: string }>({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading } = usePaymentSearch(params);

  const handleSearch = (filters: Record<string, string>) => {
    setParams((prev) => ({
      ...prev,
      year: filters.year ? Number(filters.year) : undefined,
      month: filters.month ? Number(filters.month) : undefined,
      day: filters.day ? Number(filters.day) : undefined,
      minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
      maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
      keyword: filters.keyword || undefined,
      projectCode: filters.projectCode || undefined,
      salesName: filters.salesName || undefined,
      customerName: filters.customerName || undefined,
      companyName: filters.companyName || undefined,
      page: 1,
    }));
  };

  // 重點顯示尾款 (PaymentType.FINAL)
  const finalPayments = data?.items.filter((p) => p.type === "FINAL") ?? [];
  const otherPayments = data?.items.filter((p) => p.type !== "FINAL") ?? [];

  return (
    <div className="space-y-6">
      {/* 說明卡片 */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
        <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">尾款與收款追蹤</p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            這裡顯示所有已收到的款項明細。標示為「尾款(FINAL)」的項目代表已完成該筆收據的全部收款。
          </p>
        </div>
      </div>

      <FinanceSearchBar onSearch={handleSearch} />

      {/* 尾款收據列表 */}
      {finalPayments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-600 mb-3">✅ 已收到尾款的項目</h3>
          {/* 顯示表格 */}
        </div>
      )}

      {/* 全部收款紀錄 */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-600 mb-3">📋 全部收款紀錄</h3>
        {/* 顯示表格 */}
      </div>
    </div>
  );
}
