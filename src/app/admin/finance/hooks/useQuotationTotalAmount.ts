import { useMemo, useEffect } from "react";
import { api } from "@/utils/api";

export function useQuotationTotalAmount(quotationId: string, items: { customerPrice: number }[]) {
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.customerPrice, 0), [items]);
  const updateMutation = api.adminQuotation.updateTotalAmount.useMutation();

  useEffect(() => {
    if (quotationId && totalAmount >= 0) {
      updateMutation.mutate({ id: quotationId, totalAmount });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationId, totalAmount]);

  return totalAmount;
}
