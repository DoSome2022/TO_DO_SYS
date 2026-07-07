// src/hooks/usePurchase.ts

import { api } from "@/utils/api";


// 🆕 定義採購狀態型別（與 Prisma enum 同步）
export type PurchaseStatus = 
  | "DRAFT" 
  | "PENDING" 
  | "APPROVED" 
  | "ORDERED" 
  | "PARTIAL" 
  | "COMPLETED" 
  | "CANCELLED";
// ---------- 查詢 hooks ----------
/** 採購列表（支援篩選） */
export function usePurchaseList(params?: {
  status?: PurchaseStatus;     // ← ✅ 改為精確型別
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return api.purchase.list.useQuery(
    {
      status: params?.status,
      search: params?.search,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    },
    {
      staleTime: 1000 * 30,
    }
  );
}






/** 單筆採購詳情 */
export function usePurchaseById(id: string) {
  return api.purchase.byId.useQuery(
    { id },
    { enabled: !!id }
  );
}

/** Sales 專屬：統計數據 */
export function usePurchaseStats() {
  // 可以回傳一些簡單統計，例如本月採購總額、待完成數量等
  return api.purchase.list.useQuery(
    { pageSize: 100 },
    {
      select: (data) => {
        const totalAmount = data.data.reduce(
          (sum: number, p: any) => sum + Number(p.totalAmount),
          0
        );
        const pendingCount = data.data.filter(
          (p: any) => p.status === "DRAFT" || p.status === "PENDING"
        ).length;
        const completedCount = data.data.filter(
          (p: any) => p.status === "COMPLETED"
        ).length;

        return { totalAmount, pendingCount, completedCount, total: data.total };
      },
    }
  );
}

// ---------- Mutation hooks ----------

/** 新增採購 */
export function useCreatePurchase() {
  const utils = api.useUtils();
  return api.purchase.create.useMutation({
    onSuccess: () => {
      // 成功後刷新列表
      utils.purchase.list.invalidate();
    },
  });
}

/** 更新採購 */
export function useUpdatePurchase() {
  const utils = api.useUtils();
  return api.purchase.update.useMutation({
    onSuccess: () => {
      utils.purchase.list.invalidate();
    },
  });
}

/** 刪除採購 */
export function useDeletePurchase() {
  const utils = api.useUtils();
  return api.purchase.delete.useMutation({
    onSuccess: () => {
      utils.purchase.list.invalidate();
    },
  });
}

/** 更新採購狀態 */
export function useUpdatePurchaseStatus() {
  const utils = api.useUtils();
  return api.purchase.updateStatus.useMutation({
    onSuccess: () => {
      utils.purchase.list.invalidate();
    },
  });
}
