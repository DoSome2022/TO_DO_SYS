// "use client";

// import { useState, useCallback, useMemo } from "react";
// import type { FinanceSearchParams, InvoiceStatus } from "../types";

// interface InvoiceFilterState {
//   searchParams: FinanceSearchParams & { status?: InvoiceStatus; hasBalance?: boolean };
//   statusFilter: InvoiceStatus | "ALL";
//   hasBalanceFilter: boolean | null;
// }

// export function useInvoiceFilters() {
//   const [searchParams, setSearchParams] = useState<
//     FinanceSearchParams & { status?: InvoiceStatus; hasBalance?: boolean }
//   >({
//     page: 1,
//     pageSize: 20,
//   });

//   const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");
//   const [hasBalanceFilter, setHasBalanceFilter] = useState<boolean | null>(null);

//   // 處理搜尋列提交
//   const handleSearch = useCallback((filters: Record<string, string>) => {
//     const params: FinanceSearchParams & { status?: InvoiceStatus; hasBalance?: boolean } = {
//       page: 1,
//       pageSize: 20,
//     };

//     if (filters.keyword) params.keyword = filters.keyword;
//     if (filters.year) params.year = Number(filters.year);
//     if (filters.month) params.month = Number(filters.month);
//     if (filters.day) params.day = Number(filters.day);
//     if (filters.minAmount) params.minAmount = Number(filters.minAmount);
//     if (filters.maxAmount) params.maxAmount = Number(filters.maxAmount);
//     if (filters.projectCode) params.projectCode = filters.projectCode;
//     if (filters.salesName) params.salesName = filters.salesName;
//     if (filters.customerName) params.customerName = filters.customerName;
//     if (filters.companyName) params.companyName = filters.companyName;

//     // 保留目前的 status / hasBalance 篩選
//     if (statusFilter !== "ALL") params.status = statusFilter;
//     if (hasBalanceFilter !== null) params.hasBalance = hasBalanceFilter;

//     setSearchParams(params);
//   }, [statusFilter, hasBalanceFilter]);

//   // 切換狀態篩選
//   const handleStatusChange = useCallback((status: InvoiceStatus | "ALL") => {
//     setStatusFilter(status);
//     setSearchParams((prev) => ({
//       ...prev,
//       status: status === "ALL" ? undefined : status,
//       page: 1,
//     }));
//   }, []);

//   // 切換未收尾款篩選
//   const handleBalanceFilterChange = useCallback((value: boolean | null) => {
//     setHasBalanceFilter(value);
//     setSearchParams((prev) => ({
//       ...prev,
//       hasBalance: value ?? undefined,
//       page: 1,
//     }));
//   }, []);

//   // 換頁
//   const handlePageChange = useCallback((page: number) => {
//     setSearchParams((prev) => ({ ...prev, page }));
//   }, []);

//   const activeStatus = useMemo(() => statusFilter, [statusFilter]);

//   return {
//     searchParams,
//     statusFilter,
//     hasBalanceFilter,
//     activeStatus,
//     handleSearch,
//     handleStatusChange,
//     handleBalanceFilterChange,
//     handlePageChange,
//   };
// }


"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { FinanceSearchParams, InvoiceStatus } from "../types";

export function useInvoiceFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 從 URL 解析所有參數並回傳 FinanceSearchParams + 額外篩選
  const parseParams = useCallback((): FinanceSearchParams & { status?: InvoiceStatus; hasBalance?: boolean } => {
    const params: FinanceSearchParams & { status?: InvoiceStatus; hasBalance?: boolean } = {
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || 20,
    };

    const keyword = searchParams.get("keyword");
    if (keyword) params.keyword = keyword;

    const year = searchParams.get("year");
    if (year) params.year = Number(year);

    const month = searchParams.get("month");
    if (month) params.month = Number(month);

    const day = searchParams.get("day");
    if (day) params.day = Number(day);

    const minAmount = searchParams.get("minAmount");
    if (minAmount) params.minAmount = Number(minAmount);

    const maxAmount = searchParams.get("maxAmount");
    if (maxAmount) params.maxAmount = Number(maxAmount);

    const projectCode = searchParams.get("projectCode");
    if (projectCode) params.projectCode = projectCode;

    const salesName = searchParams.get("salesName");
    if (salesName) params.salesName = salesName;

    const customerName = searchParams.get("customerName");
    if (customerName) params.customerName = customerName;

    const companyName = searchParams.get("companyName");
    if (companyName) params.companyName = companyName;

    const status = searchParams.get("status");
    if (status && status !== "ALL") params.status = status as InvoiceStatus;

    const hasBalance = searchParams.get("hasBalance");
    if (hasBalance === "true") params.hasBalance = true;
    else if (hasBalance === "false") params.hasBalance = false;

    return params;
  }, [searchParams]);

  const searchParamsRes = useMemo(() => parseParams(), [parseParams]);

  // 從 URL 直接取得 statusFilter 與 hasBalanceFilter
  const statusFilter: InvoiceStatus | "ALL" = (searchParams.get("status") as InvoiceStatus | "ALL") || "ALL";
  const hasBalanceFilter: boolean | null = (() => {
    const val = searchParams.get("hasBalance");
    if (val === "true") return true;
    if (val === "false") return false;
    return null;
  })();

  // 統一的 URL 參數更新函式
  const updateParams = useCallback(
    (newParams: Record<string, string | undefined | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || value === "ALL") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  // 處理搜尋列提交（保留現有 status / hasBalance）
  const handleSearch = useCallback(
    (filters: Record<string, string>) => {
      const newParams: Record<string, string | undefined> = {};

      // 將 filters 中的值轉為參數（空字串視為 undefined）
      const mapFilter = (key: string, value: string) => (value ? value : undefined);
      newParams.keyword = mapFilter("keyword", filters.keyword);
      newParams.year = mapFilter("year", filters.year);
      newParams.month = mapFilter("month", filters.month);
      newParams.day = mapFilter("day", filters.day);
      newParams.minAmount = mapFilter("minAmount", filters.minAmount);
      newParams.maxAmount = mapFilter("maxAmount", filters.maxAmount);
      newParams.projectCode = mapFilter("projectCode", filters.projectCode);
      newParams.salesName = mapFilter("salesName", filters.salesName);
      newParams.customerName = mapFilter("customerName", filters.customerName);
      newParams.companyName = mapFilter("companyName", filters.companyName);

      // 保留目前的 status 與 hasBalance（從當前 URL 取得）
      const currentStatus = searchParams.get("status");
      if (currentStatus && currentStatus !== "ALL") newParams.status = currentStatus;
      const currentHasBalance = searchParams.get("hasBalance");
      if (currentHasBalance) newParams.hasBalance = currentHasBalance;

      // 重置為第一頁
      newParams.page = "1";

      updateParams(newParams);
    },
    [searchParams, updateParams]
  );

  // 切換狀態篩選
  const handleStatusChange = useCallback(
    (status: InvoiceStatus | "ALL") => {
      updateParams({
        status: status === "ALL" ? undefined : status,
        page: "1",
      });
    },
    [updateParams]
  );

  // 切換未收尾款篩選
  const handleBalanceFilterChange = useCallback(
    (value: boolean | null) => {
      updateParams({
        hasBalance: value === null ? undefined : value.toString(),
        page: "1",
      });
    },
    [updateParams]
  );

  // 換頁
  const handlePageChange = useCallback(
    (page: number) => {
      updateParams({ page: page.toString() });
    },
    [updateParams]
  );

  const activeStatus = useMemo(() => statusFilter, [statusFilter]);

  return {
    searchParams: searchParamsRes,
    statusFilter,
    hasBalanceFilter,
    activeStatus,
    handleSearch,
    handleStatusChange,
    handleBalanceFilterChange,
    handlePageChange,
  };
}
