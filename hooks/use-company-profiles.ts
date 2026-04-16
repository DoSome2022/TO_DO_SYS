// src/hooks/use-company-profiles.ts
"use client";

import { toast } from "sonner";
import { api } from "@/utils/api"; // 請確認你的 api 引入路徑正確

export function useCompanyProfiles() {
  const { data: companies, isLoading, refetch } = api.companyProfile.getAll.useQuery();

  const createMutation = api.companyProfile.create.useMutation({
    onSuccess: () => {
      toast.success("公司資料建立成功！");
      refetch();
    },
    onError: (err) => toast.error(`建立失敗: ${err.message}`),
  });

  const deleteMutation = api.companyProfile.delete.useMutation({
    onSuccess: () => {
      toast.success("公司資料已刪除！");
      refetch();
    },
    onError: (err) => toast.error(`刪除失敗 (可能已被使用): ${err.message}`),
  });

  return {
    companies,
    isLoading,
    createCompany: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteCompany: deleteMutation.mutateAsync,
  };
}
