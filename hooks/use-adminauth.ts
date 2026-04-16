// src/hooks/use-auth.ts
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoginValues } from "@/lib/schemas/adminauth";


export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const loginAdmin = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      // 呼叫你 auth.ts 裡定義好的 staff-login (員工/管理員登入)
      const result = await signIn("staff-login", {
        name: data.name,
        password: data.password,
        redirect: false, // 設為 false 讓我們可以自己控制 toast 和跳轉
      });

      if (result?.error) {
        toast.error("登入失敗：帳號名稱或密碼錯誤！");
      } else if (result?.ok) {
        toast.success("登入成功，歡迎回來！");
        router.push("/admin/dashboard"); // 登入後要跳轉的後台首頁
        router.refresh(); // 刷新 Server Components 狀態
      }
    } catch (error) {
      toast.error("系統發生未知的錯誤，請重試。");
    } finally {
      setIsLoading(false);
    }
  };

  return { loginAdmin, isLoading };
}
