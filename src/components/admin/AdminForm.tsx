// src/components/Admin/AdminForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminFormSchema, type AdminFormValues } from "@/lib/schemas/admin";

interface AdminFormProps {
  onSubmit: (data: AdminFormValues) => Promise<void>;
  isLoading: boolean;
}

export function AdminForm({ onSubmit, isLoading }: AdminFormProps) {
  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const handleSubmit = async (data: AdminFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-w-md">
      <div>
        <label className="text-sm font-medium mb-1 block">管理員帳號 (登入用) *</label>
        <Input {...form.register("name")} placeholder="例如：admin_root" />
        {form.formState.errors.name && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">電子郵件 (選填)</label>
        <Input {...form.register("email")} type="email" placeholder="admin@example.com" />
        {form.formState.errors.email && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">設定密碼 *</label>
        <Input {...form.register("password")} type="password" placeholder="至少 6 位數" />
        {form.formState.errors.password && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">確認密碼 *</label>
        <Input {...form.register("confirmPassword")} type="password" placeholder="再次輸入密碼" />
        {form.formState.errors.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "建立中..." : "建立管理員帳號"}
      </Button>
    </form>
  );
}
