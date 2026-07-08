// components/sales/quotations/hooks/useQuotationItems.ts

import { api } from "@/utils/api";


export function useAddItem() {
  const utils = api.useUtils();
  return api.quotation.addItem.useMutation({
    onSuccess: () => utils.quotation.getQuotationById.invalidate(),
  });
}

export function useUpdateItem() {
  const utils = api.useUtils();
  return api.quotation.updateItem.useMutation({
    onSuccess: () => utils.quotation.getQuotationById.invalidate(),
  });
}

export function useRemoveItem() {
  const utils = api.useUtils();
  return api.quotation.removeItem.useMutation({
    onSuccess: () => utils.quotation.getQuotationById.invalidate(),
  });
}
