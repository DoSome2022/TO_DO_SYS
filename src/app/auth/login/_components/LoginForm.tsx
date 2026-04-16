"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation"; // 1. 引入 useRouter

export function LoginForm() {
  const form = useForm();
  const router = useRouter(); // 2. 初始化 router

  const onSubmit = async (data: any) => {
    // 3. 將 redirect 改為 false
    const result = await signIn("customer-login", {
      name: data.name,
      password: data.password,
      redirect: false, 
    });

    // 4. 根據 result 判斷登入成功或失敗
    if (result?.error) {
      alert("帳號或密碼錯誤！");
    } else if (result?.ok) {
      console.log("登入成功:", data);
      router.push("/"); // 登入成功後手動導向首頁
      router.refresh(); // 重新整理頁面資料與狀態 (讓 Navbar 更新)
    }
  };

  return (
    <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-lg p-8 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-500 mb-2">
          歡迎回來
        </h1>
        <p className="text-neutral-400">登入以繼續您的影視專案</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div>
          {/* 👇 2. 標籤與提示文字改成「使用者名稱」 */}
          <label className="block text-sm text-neutral-400 mb-1">使用者名稱</label>
          <input 
            {...form.register("name")} // 👈 從 "email" 改為 "name"
            type="text"                  // 👈 type 從 "email" 改為 "text"
            placeholder="請輸入帳號名稱" 
            className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 rounded focus:outline-none focus:border-amber-500 transition-colors" 
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm text-neutral-400">密碼</label>
            <Link href="/auth/forgot-password" className="text-xs text-amber-500 hover:text-amber-400">
              忘記密碼？
            </Link>
          </div>
          <input 
            {...form.register("password")} 
            type="password"
            placeholder="••••••••" 
            className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 rounded focus:outline-none focus:border-amber-500 transition-colors" 
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-amber-600 text-white py-3 rounded hover:bg-amber-700 transition font-medium mt-4"
        >
          登入
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-neutral-500">
        還沒有帳號嗎？{" "}
        <Link href="/auth/register" className="text-amber-500 hover:text-amber-400 transition-colors">
          立即註冊
        </Link>
      </div>
    </div>
  );
}
