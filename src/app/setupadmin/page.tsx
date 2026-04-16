// src/app/setupadmin/page.tsx
"use client";


import Link from "next/link";
import { useAdmin } from "../../../hooks/use-admin";
import { AdminForm } from "@/components/admin/AdminForm";

export default function SetupAdminPage() {
  const { createAdmin, isCreating } = useAdmin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2">初始化系統管理員</h1>
        <p className="text-muted-foreground text-sm mb-6">
          請建立最高權限管理員 (Admin) 帳號，建立後您可以使用此帳號登入系統。
        </p>

        <AdminForm 
          onSubmit={async (data) => {
            // 注意：這裡不需要傳 confirmPassword 給後端，所以我們手動剔除它
            await createAdmin({
              name: data.name,
              email: data.email,
              password: data.password,
            });
          }} 
          isLoading={isCreating} 
        />

        <div className="mt-6 text-center text-sm">
          <Link href="/auth/login" className="text-amber-600 hover:underline">
            已有帳號？前往登入
          </Link>
        </div>
      </div>
    </div>
  );
}
