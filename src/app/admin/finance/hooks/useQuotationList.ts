"use client";

import { useState, useCallback } from "react";
import { useQuotationSearch } from "../api";
import type { FinanceSearchParams } from "../types";

export function useQuotationList(initialParams?: Partial<FinanceSearchParams>) {
  const [searchParams, setSearchParams] = useState<FinanceSearchParams>({
    page: 1,
    pageSize: 20,
    ...initialParams,
  });

  const query = useQuotationSearch(searchParams);

  const updateSearch = useCallback((updates: Partial<FinanceSearchParams>) => {
    setSearchParams((prev) => ({
      ...prev,
      ...updates,
      page: updates.page ?? 1, // 篩選條件變更時回到第一頁
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setSearchParams((prev) => ({ ...prev, page }));
  }, []);

  return {
    ...query,
    searchParams,
    updateSearch,
    goToPage,
  };
}
