"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";

export function ForgotPasswordForm() {
  const form = useForm();

  const onSubmit = (data: any) => {
    console.log("重設密碼的信箱:", data);
    // 這裡之後可以接 API 發送重設密碼信件
    alert("如果該信箱存在，我們已發送重設密碼連結給您。");
  };

  return (
    <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-lg p-8 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-500 mb-2">
          重設密碼
        </h1>
        <p className="text-neutral-400">
          請輸入您的電子郵件，我們將發送重設密碼的連結給您。
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">電子郵件</label>
          <input 
            {...form.register("email")} 
            type="email"
            placeholder="name@example.com" 
            className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 rounded focus:outline-none focus:border-amber-500 transition-colors" 
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-amber-600 text-white py-3 rounded hover:bg-amber-700 transition font-medium mt-4"
        >
          發送重設連結
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-neutral-500 flex flex-col space-y-2">
        <span>
          記起密碼了嗎？{" "}
          <Link href="/auth/login" className="text-amber-500 hover:text-amber-400 transition-colors">
            返回登入
          </Link>
        </span>
        <span>
          還沒有帳號嗎？{" "}
          <Link href="/auth/register" className="text-amber-500 hover:text-amber-400 transition-colors">
            立即註冊
          </Link>
        </span>
      </div>
    </div>
  );
}
