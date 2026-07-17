//src/app/admin/finance/quotations/page.tsx

"use client";


import { useQuotationList } from "../hooks/useQuotationList";
import { FinanceSearchBar } from "../components/FinanceSearchBar";
import { QuotationTable } from "../components/QuotationTable";

export default function AdminQuotationsPage() {
  const { data, isLoading, updateSearch } = useQuotationList();

  const handleSearch = (filters: Record<string, string>) => {
    updateSearch({
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
      quotationNumber: filters.quotationNumber || undefined,
      page: 1,
    });
  };

  return (
    <div className="space-y-4">
      <FinanceSearchBar onSearch={handleSearch} />
      <QuotationTable data={data} isLoading={isLoading} />
    </div>
  );
}
