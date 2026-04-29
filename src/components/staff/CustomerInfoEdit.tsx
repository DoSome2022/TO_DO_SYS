// src/components/staff/CustomerInfoEdit.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "../../../trpc/client";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";

// ===== Zod Schema =====
const customerEditSchema = z.object({
  name: z.string().optional().nullable(),
  customname: z.string().optional().nullable(),
  contactname: z.string().optional().nullable(),
  contactphone: z.string().optional().nullable(),
  companyname: z.string().optional().nullable(),
  companyaddress: z.string().optional().nullable(),
  companyemail: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

type CustomerEditFormData = z.infer<typeof customerEditSchema>;

type CustomerInfoEditProps = {
  customer: {
    id: string;
    name?: string | null;
    customname?: string | null;
    contactname?: string | null;
    contactphone?: string | null;
    companyname?: string | null;
    companyaddress?: string | null;
    companyemail?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  onCancel: () => void;
  onSuccess: () => void;
};

export default function CustomerInfoEdit({ customer, onCancel, onSuccess }: CustomerInfoEditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<CustomerEditFormData>({
    resolver: zodResolver(customerEditSchema),
    defaultValues: {
      name: customer.name ?? "",
      customname: customer.customname ?? "",
      contactname: customer.contactname ?? "",
      contactphone: customer.contactphone ?? "",
      companyname: customer.companyname ?? "",
      companyaddress: customer.companyaddress ?? "",
      companyemail: customer.companyemail ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
    },
  });

  // tRPC mutation
  const updateMutation = trpc.staff.updateCustomerInfo.useMutation({
    onSuccess: () => {
      toast.success("客戶資料已更新！");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗，請稍後再試");
    },
  });

  const onSubmit = async (data: CustomerEditFormData) => {
    if (!isDirty) {
      toast.info("沒有變更任何資料");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        customerId: customer.id,
        ...data,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 表單欄位定義（方便批次渲染）
  const fields: {
    key: keyof CustomerEditFormData;
    label: string;
    placeholder: string;
    type?: string;
    colSpan?: boolean;
  }[] = [
    { key: "name", label: "客戶名稱", placeholder: "輸入客戶名稱" },
    { key: "customname", label: "顯示名稱", placeholder: "輸入顯示名稱" },
    { key: "contactname", label: "聯絡人名稱", placeholder: "輸入聯絡人名稱" },
    { key: "contactphone", label: "聯絡人電話", placeholder: "輸入聯絡人電話" },
    { key: "email", label: "電子郵件", placeholder: "輸入電子郵件", type: "email" },
    { key: "phone", label: "聯絡電話", placeholder: "輸入聯絡電話" },
    { key: "companyname", label: "公司名稱", placeholder: "輸入公司名稱" },
    { key: "companyemail", label: "公司信箱", placeholder: "輸入公司信箱", type: "email" },
    { key: "companyaddress", label: "公司地址", placeholder: "輸入公司地址", colSpan: true },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
      {/* 頂部操作列 */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">編輯客戶資料</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg text-sm
                       hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                       hover:bg-blue-700 transition-colors flex items-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSubmitting ? "儲存中..." : "儲存變更"}
          </button>
        </div>
      </div>

      {/* 表單欄位 */}
      <div className="space-y-6">
        {/* 聯絡人資訊 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            聯絡人資訊
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.slice(0, 6).map((field) => (
              <FormField
                key={field.key}
                label={field.label}
                placeholder={field.placeholder}
                type={field.type}
                error={errors[field.key]?.message}
                {...register(field.key)}
              />
            ))}
          </div>
        </div>

        {/* 公司資訊 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            公司資訊
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.slice(6).map((field) => (
              <div key={field.key} className={field.colSpan ? "md:col-span-2" : ""}>
                <FormField
                  label={field.label}
                  placeholder={field.placeholder}
                  type={field.type}
                  error={errors[field.key]?.message}
                  {...register(field.key)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部操作按鈕（行動版快速操作） */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg
                     hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium
                     hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "儲存中..." : "確認儲存"}
        </button>
      </div>
    </form>
  );
}

// ===== 輔助元件：表單欄位 =====
import { forwardRef } from "react";

const FormField = forwardRef<
  HTMLInputElement,
  {
    label: string;
    placeholder: string;
    type?: string;
    error?: string;
  }
>(({ label, placeholder, type = "text", error, ...rest }, ref) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 
          ${error
            ? "border-red-300 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          } transition-colors`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

FormField.displayName = "FormField";
