// src/components/Auth/AdminLoginForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import Link from "next/link";
import { loginSchema, LoginValues } from "@/lib/schemas/adminauth";

interface AdminLoginFormProps {
  onSubmit: (data: LoginValues) => Promise<void>;
  isLoading: boolean;
}

export function AdminLoginForm({ onSubmit, isLoading }: AdminLoginFormProps) {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { name: "", password: "" },
  });

  const handleSubmit = async (data: LoginValues) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">管理員帳號</label>
        <Input 
          {...form.register("name")} 
          placeholder="請輸入帳號名稱" 
          disabled={isLoading}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium">密碼</label>
          <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
            忘記密碼？
          </Link>
        </div>
        <Input 
          {...form.register("password")} 
          type="password" 
          placeholder="••••••••" 
          disabled={isLoading}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "驗證中..." : "登入系統"}
      </Button>
    </form>
  );
}
