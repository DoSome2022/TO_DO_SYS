"use client";


import { api } from "@/utils/api";
import { toast } from "sonner";



export function useServices() {
  // 1. 獲取資料
  const { data: services, isLoading, refetch } = api.service.getAll.useQuery();

  // 2. 定義 Mutations
  const createMutation = api.service.create.useMutation({
    onSuccess: () => {
      toast.success("服務建立成功！");
      refetch();
    },
    onError: (err) => toast.error(`建立失敗: ${err.message}`),
  });

  const toggleMutation = api.service.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("狀態更新成功！");
      refetch();
    },
  });

  const deleteMutation = api.service.delete.useMutation({
    onSuccess: () => {
      toast.success("服務已刪除！");
      refetch();
    },
    onError: (err) => toast.error(`刪除失敗 (可能已被使用): ${err.message}`),
  });

  // 3. 匯出給 UI 使用的介面
  return {
    services,
    isLoading,
    createService: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    toggleActive: toggleMutation.mutateAsync,
    deleteService: deleteMutation.mutateAsync,
  };
}
