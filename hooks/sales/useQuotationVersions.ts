// components/sales/quotations/hooks/useQuotationVersions.ts

import { api } from "@/utils/api";


export function useVersions(quotationId: string) {
  return api.quotation.getVersions.useQuery(
    { quotationId },
    { enabled: !!quotationId }
  );
}

export function useCreateVersion() {
  const utils = api.useUtils();
  return api.quotation.createVersion.useMutation({
    onSuccess: () => {
      utils.quotation.getVersions.invalidate();
      utils.quotation.getQuotationById.invalidate();
    },
  });
}

export function useRevertToVersion() {
  const utils = api.useUtils();
  return api.quotation.revertToVersion.useMutation({
    onSuccess: () => {
      utils.quotation.getVersions.invalidate();
      utils.quotation.getQuotationById.invalidate();
    },
  });
}
