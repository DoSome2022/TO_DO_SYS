// src/app/auth/admin/login/page.tsx
"use client";

import { AdminLoginForm } from "@/components/admin/auth/adminLoginForm";
import { useAuth } from "../../../../../hooks/use-adminauth";


export default function AdminLoginPage() {
  const { loginAdmin, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border rounded-xl shadow-lg p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">後台管理系統</h1>
          <p className="text-muted-foreground text-sm">請輸入管理員帳號密碼登入</p>
        </div>

        {/* 完美結合：將 hook 產出的 function 與 loading 狀態塞給元件 */}
        <AdminLoginForm 
          onSubmit={async (data) => {
            await loginAdmin(data);
          }} 
          isLoading={isLoading} 
        />
        
      </div>
    </div>
  );
}
