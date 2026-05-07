import { api } from "@/utils/api";
import type { z } from "zod";
import { invoiceSearchSchema } from "@/lib/schemas/finance/invoiceSearchSchema";
import { paymentSearchSchema } from "@/lib/schemas/finance/paymentSearchSchema";
import { quotationSearchSchema } from "@/lib/schemas/finance/quotationSearchSchema";
// 從 Zod Schema 推導出 input 型別
type InvoiceSearchInput = z.infer<typeof invoiceSearchSchema>;
type PaymentSearchInput = z.infer<typeof paymentSearchSchema>;
type QuotationSearchInput = z.infer<typeof quotationSearchSchema>;
// ── 報價單 ────────────────────────────

export const useQuotationList = (filters?: QuotationSearchInput) => api.adminQuotation.search.useQuery(filters ?? {});

export const useQuotationById = (id: string) =>
  api.adminQuotation.getById.useQuery({ id });

export const useQuotationSummary = (year?: number) =>
  api.adminQuotation.summary.useQuery(year ? { year } : undefined);

export const useUpdateTotalAmount = () =>
  api.adminQuotation.updateTotalAmount.useMutation();

// ── 收據 ──────────────────────────────
export const useInvoiceList = (filters?: InvoiceSearchInput) => api.adminInvoice.search.useQuery(filters ?? {});

export const useInvoiceById = (id: string) =>
  api.adminInvoice.getById.useQuery({ id });

export const useInvoiceSummary = (year?: number) =>
  api.adminInvoice.summary.useQuery(year ? { year } : undefined);

// ── 付款 ──────────────────────────────
export const usePaymentList = (filters?: PaymentSearchInput) => api.adminPayment.search.useQuery(filters ?? {});

export const usePaymentById = (id: string) =>
  api.adminPayment.getById.useQuery({ id });

export const useMonthlyPaymentSummary = (year: number, month: number) =>
  api.adminPayment.monthlySummary.useQuery({ year, month });
