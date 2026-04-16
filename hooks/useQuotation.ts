"use client";

import { trpc } from "../trpc/client";

// ==========================================
// 型別定義
// ==========================================

// 從 tRPC router 推導出的型別
type QuotationStatus = "DRAFT" | "NEGOTIATING" | "WON" | "LOST";

interface GetQuotationsParams {
  status?: QuotationStatus;
  limit?: number;
  cursor?: string;
}

// ==========================================
// Query Hooks (讀取資料)
// ==========================================

export function useQuotations(params?: GetQuotationsParams) {
  return trpc.quotation.getQuotations.useQuery(params);
}

export function useQuotationById(id: string) {
  return trpc.quotation.getQuotationById.useQuery(
    { id },
    { enabled: !!id }
  );
}

export function useSalesStats() {
  return trpc.quotation.getSalesStats.useQuery();
}

export function useSalesQuotations() {
  return trpc.quotation.getSalesQuotations.useQuery();
}

export function useSalesProjects() {
  return trpc.quotation.getSalesProjects.useQuery();
}

export function useSalesCustomers() {
  return trpc.quotation.getSalesCustomers.useQuery();
}

export function useAvailableCustomers() {
  return trpc.quotation.getAvailableCustomers.useQuery();
}

// ==========================================
// Internal Messages (內部對話)
// ==========================================

export function useInternalMessages(quotationId: string) {
  return trpc.quotation.getInternalMessages.useQuery(
    { quotationId },
    { enabled: !!quotationId }
  );
}

export function useSendInternalMessage() {
  const utils = trpc.useUtils();
  
  return trpc.quotation.sendInternalMessage.useMutation({
    onSuccess: (_, variables) => {
      utils.quotation.getInternalMessages.invalidate({ 
        quotationId: variables.quotationId 
      });
      utils.quotation.getQuotationById.invalidate({ 
        id: variables.quotationId 
      });
    },
  });
}

// ==========================================
// External Messages (外部對話)
// ==========================================

export function useExternalMessages(quotationId: string) {
  return trpc.quotation.getExternalMessages.useQuery(
    { quotationId },
    { enabled: !!quotationId }
  );
}

export function useSendExternalMessage() {
  const utils = trpc.useUtils();
  
  return trpc.quotation.sendExternalMessage.useMutation({
    onSuccess: (_, variables) => {
      utils.quotation.getExternalMessages.invalidate({ 
        quotationId: variables.quotationId 
      });
      utils.quotation.getQuotationById.invalidate({ 
        id: variables.quotationId 
      });
    },
  });
}

// ==========================================
// Mutation Hooks (寫入資料)
// ==========================================

export function useCreateQuotation() {
  const utils = trpc.useUtils();
  
  return trpc.quotation.createQuotation.useMutation({
    onSuccess: () => {
      utils.quotation.getSalesQuotations.invalidate();
      utils.quotation.getSalesStats.invalidate();
      utils.quotation.getQuotations.invalidate();
    },
  });
}

export function useUpdateQuotation() {
  const utils = trpc.useUtils();
  
  return trpc.quotation.updateQuotation.useMutation({
    onSuccess: (_, variables) => {
      utils.quotation.getQuotationById.invalidate({ id: variables.quotationId });
      utils.quotation.getSalesQuotations.invalidate();
      utils.quotation.getQuotations.invalidate();
    },
  });
}

export function useUpdateQuotationStatus() {
  const utils = trpc.useUtils();
  
  return trpc.quotation.updateQuotationStatus.useMutation({
    onSuccess: (_, variables) => {
      utils.quotation.getSalesQuotations.invalidate();
      utils.quotation.getSalesStats.invalidate();
      utils.quotation.getQuotations.invalidate();
      utils.quotation.getQuotationById.invalidate({ id: variables.quotationId });
    },
  });
}

export function useDeleteQuotation() {
  const utils = trpc.useUtils();
  
  return trpc.quotation.deleteQuotation.useMutation({
    onSuccess: () => {
      utils.quotation.getSalesQuotations.invalidate();
      utils.quotation.getSalesStats.invalidate();
      utils.quotation.getQuotations.invalidate();
    },
  });
}