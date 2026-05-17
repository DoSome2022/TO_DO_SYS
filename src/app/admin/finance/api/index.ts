// src/app/admin/finance/api/index.ts

import { api } from "@/utils/api";
import { keepPreviousData } from "@tanstack/react-query"; // 新增匯入
import type { FinanceSearchParams,InvoiceStatus } from "../types";

// ==========================================
// 報價單 API
// ==========================================
export function useQuotationSearch(params: FinanceSearchParams) {
  return api.adminQuotation.search.useQuery(params, {
    placeholderData: keepPreviousData, // 修改這裡
  });
}

export function useQuotationDetail(id: string) {
  return api.adminQuotation.getById.useQuery(
    { id },
    { enabled: !!id }
  );
}

export function useQuotationSummary(year?: number) {
  return api.adminQuotation.summary.useQuery({ year });
}

// ==========================================
// 收據 API
// ==========================================
// export function useInvoiceSearch(
//   params: FinanceSearchParams & {
//     status?: string;
//     hasBalance?: boolean;
//   }
// ) {
//   return api.adminInvoice.search.useQuery(params, {
//     placeholderData: keepPreviousData, // 修改這裡
//   });
// }
type InvoiceSearchParams = FinanceSearchParams & {
  status?: InvoiceStatus;
  hasBalance?: boolean;
};
export function useInvoiceSearch(params: InvoiceSearchParams) {
  return api.adminInvoice.search.useQuery(params, {
    placeholderData: keepPreviousData,
  });
}
export function useInvoiceDetail(id: string) {
  return api.adminInvoice.getById.useQuery(
    { id },
    { enabled: !!id }
  );
}

export function useInvoiceSummary(year?: number) {
  return api.adminInvoice.summary.useQuery({ year });
}

// ==========================================
// 付款紀錄 API
// ==========================================
export function usePaymentSearch(
  params: FinanceSearchParams & {
    paymentType?: string;
    paymentMethod?: string;
  }
) {
  return api.adminPayment.search.useQuery(params, {
    placeholderData: keepPreviousData, // 修改這裡
  });
}

export function useMonthlySummary(year: number, month: number) {
  return api.adminPayment.monthlySummary.useQuery(
    { year, month },
    { enabled: !!year && !!month }
  );
}


// ==========================================
// 付款紀錄 API（補齊）
// ==========================================
export function usePaymentDetail(id: string) {
  return api.adminPayment.getById.useQuery(
    { id },
    { enabled: !!id }
  );
}