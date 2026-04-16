"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { trpc } from "../../../../../trpc/client";


export function RegisterForm() {
  const form = useForm();
  const router = useRouter();

  // 初始化 tRPC 的 createCustomer mutation
  const createCustomerMutation = trpc.customer.createCustomer.useMutation({
    onSuccess: () => {
      alert("註冊成功！請使用新帳號登入。");
      router.push("/auth/login"); // 註冊成功後導向登入頁
    },
    onError: (error) => {
      alert(`註冊失敗：${error.message}`);
    }
  });

  const onSubmit = (data: any) => {
    // 1. 檢查兩次密碼是否一致
    if (data.password !== data.confirmPassword) {
      alert("兩次輸入的密碼不一致，請重新確認！");
      return;
    }

    // 2. 呼叫 tRPC API
    createCustomerMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password, // 傳送密碼給後端
    });
  };

  return (
    <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-lg p-8 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-500 mb-2">
          建立帳號
        </h1>
        <p className="text-neutral-400">開始您的專屬影視製作之旅</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">姓名 / 公司名稱</label>
          <input 
            {...form.register("name")} 
            type="text"
            placeholder="王小明 或 某某有限公司" 
            className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 rounded focus:outline-none focus:border-amber-500 transition-colors" 
            required
          />
        </div>

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

        <div>
          <label className="block text-sm text-neutral-400 mb-1">密碼</label>
          <input 
            {...form.register("password")} 
            type="password"
            placeholder="設定至少 6 位數密碼" 
            className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 rounded focus:outline-none focus:border-amber-500 transition-colors" 
            required
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">確認密碼</label>
          <input 
            {...form.register("confirmPassword")} 
            type="password"
            placeholder="再次輸入密碼" 
            className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 rounded focus:outline-none focus:border-amber-500 transition-colors" 
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={createCustomerMutation.isPending}
          className="w-full bg-amber-600 text-white py-3 rounded hover:bg-amber-700 transition font-medium mt-6 disabled:opacity-50"
        >
          {createCustomerMutation.isPending ? "註冊中..." : "註冊帳號"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-neutral-500">
        已經有帳號了？{" "}
        <Link href="/auth/login" className="text-amber-500 hover:text-amber-400 transition-colors">
          立即登入
        </Link>
      </div>
    </div>
  );
}
