// hooks/useUserProfile.ts

import { trpc } from "../trpc/client";
import { useCallback } from "react";

export function useUserProfile() {
  return trpc.user.getMyProfile.useQuery();
}

// 方案二：回傳檢查權限的函數
export function useHasPermission() {
  const { data: profile } = useUserProfile();
  
  // 回傳一個檢查權限的函數
  return useCallback(
    (code: string) => {
      return profile?.permissions.some((p: any) => p.code === code) ?? false;
    },
    [profile] // 依賴 profile，避免不必要的重新創建
  );
}

export function useDynamicFeatures() {
  const { data: profile } = useUserProfile();
  return profile?.dynamicFeatures ?? [];
}

// 如果你還需要直接取得權限碼陣列的版本（可選）
export function usePermissionCodes() {
  const { data: profile } = useUserProfile();
  return profile?.permissions.map((p: any) => p.code) ?? [];
}