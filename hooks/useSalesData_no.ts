"use client";

import { trpc } from "../trpc/client";



export function useSalesStats() {
  const utils = trpc.useUtils();
  const query = trpc.quotation.getSalesStats.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5分鐘
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSalesQuotations() {
  const query = trpc.quotation.getQuotations.useQuery(undefined, {
    staleTime: 30 * 1000, // 30秒
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    mutate: query.refetch, // 別名，方便使用
  };
}

export function useSalesProjects() {
  const query = trpc.quotation.getSalesProjects.useQuery(undefined, {
    staleTime: 30 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSalesCustomers() {
  const query = trpc.quotation.getSalesCustomers.useQuery(undefined, {
    staleTime: 30 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAvailableCustomers() {
  const query = trpc.quotation.getAvailableCustomers.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Mutation hooks
export function useCreateQuotation() {
  const utils = trpc.useUtils();
  const mutation = trpc.quotation.createQuotation.useMutation({
    onSuccess: () => {
      // 重新驗證相關查詢
      utils.quotation.getQuotations.invalidate();
      utils.quotation.getSalesStats.invalidate();
    },
  });

  return mutation;
}

export function useUpdateQuotationStatus() {
  const utils = trpc.useUtils();
  const mutation = trpc.quotation.updateQuotationStatus.useMutation({
    onSuccess: () => {
      utils.quotation.getQuotations.invalidate();
      utils.quotation.getSalesStats.invalidate();
    },
  });

  return mutation;
}