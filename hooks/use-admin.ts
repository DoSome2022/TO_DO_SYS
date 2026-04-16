// src/hooks/use-admin.ts
"use client";

import { toast } from "sonner";
import { api } from "@/utils/api";

export function useAdmin() {
  const createAdminMutation = api.adminUser.createAdmin.useMutation({
    onSuccess: () => {
      toast.success("管理員帳號建立成功！現在可以前往登入頁面了。");
    },
    onError: (err) => {
      toast.error(`建立失敗: ${err.message}`);
    },
  });

  return {
    createAdmin: createAdminMutation.mutateAsync,
    isCreating: createAdminMutation.isPending,
  };
}
