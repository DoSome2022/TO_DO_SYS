"use client";

import { toast } from "sonner";
import { api } from "@/utils/api";

export function useProjects() {
  const { data: projects, isLoading: isProjectsLoading, refetch } = api.project.getProjectAll.useQuery();
  const { data: pmCandidates, isLoading: isPmLoading } = api.project.getPMCandidates.useQuery();
  
  // 加上各自的 isLoading 狀態
  const { data: customers, isLoading: isCusLoading } = api.customer.getAllCustomer.useQuery();
  const { data: companies, isLoading: isCompLoading } = api.companyProfile.getAll.useQuery();
  const { data: availableServices, isLoading: isServLoading } = api.service.getActive.useQuery();

  const createMutation = api.project.createProject.useMutation({
    onSuccess: () => {
      toast.success("專案與報價單建立成功！");
      refetch();
    },
    onError: (err) => toast.error(`建立失敗: ${err.message}`),
  });

  const updateMutation = api.project.updateProject.useMutation({
    onSuccess: () => {
      toast.success("專案更新成功！");
      refetch();
    },
    onError: (err) => toast.error(`更新失敗: ${err.message}`),
  });

  return {
    projects,
    pmCandidates,
    // 👇 把所有的 Loading 狀態合併，確保全部抓完才算準備好
    isLoading: isProjectsLoading || isPmLoading || isCusLoading || isCompLoading || isServLoading,
    createProject: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateProject: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    
    // 匯出這三個給表單下拉選單用
    customers: customers ?? [],
    companies: companies ?? [],
    availableServices: availableServices ?? [],
  };
}
