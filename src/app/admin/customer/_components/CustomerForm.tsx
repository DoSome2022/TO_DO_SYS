"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { trpc } from "../../../../../trpc/client";

// ========== 1. 分開定義 Create / Update 的 Schema ==========

const createSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  companyname: z.string().optional(),
  contactname: z.string().optional(),
  customname: z.string().optional(),
  contactphone: z.string().optional(),
  companyaddress: z.string().optional(),
  companyemail: z.string().email().optional().or(z.literal("")),
  password: z.string().min(1, "請輸入密碼"), // 新增時必填
});

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  companyname: z.string().optional(),
  contactname: z.string().optional(),
  customname: z.string().optional(),
  contactphone: z.string().optional(),
  companyaddress: z.string().optional(),
  companyemail: z.string().email().optional().or(z.literal("")),
  password: z.string().optional(), // 編輯時可選，留空不修改
});

export default function CustomerForm({ customerId }: { customerId?: string }) {
  const router = useRouter();
  const isEdit = !!customerId;

  // 2. tRPC Queries & Mutations
  const { data: customerData, isLoading: isFetching } = trpc.customer.getCustomer.useQuery(
    { id: customerId! },
    { enabled: isEdit }
  );

  const createMut = trpc.customer.createCustomer.useMutation({
    onSuccess: () => {
      toast.success("客戶建立成功！");
      router.push("/admin/customer");
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMut = trpc.customer.updateCustomer.useMutation({
    onSuccess: () => {
      toast.success("客戶更新成功！");
      router.push("/admin/customer");
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  // ========== 3. 表單提交處理（完整修正版） ==========

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());

    // 空字串轉 undefined
    const cleanedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawData)) {
      if (isEdit && key === "password" && value === "") {
        continue;
      }
      cleanedData[key] = value === "" ? undefined : value;
    }

    // ⭐ 重點：分開驗證，型別安全
    if (isEdit) {
      const parsed = updateSchema.safeParse(cleanedData);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "表單驗證失敗");
        return;
      }
      updateMut.mutate({ id: customerId!, ...parsed.data });
    } else {
      const parsed = createSchema.safeParse(cleanedData);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "表單驗證失敗");
        return;
      }
      createMut.mutate(parsed.data);
    }
  };


  const isSubmitting = createMut.isPending || updateMut.isPending;

  // 如果是編輯模式且資料還在載入中
  if (isEdit && isFetching) {
    return (
      <div className="flex justify-center my-10">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Email <span className="text-gray-400 text-xs">（選填）</span>
        </label>
        <input
          name="email"
          type="email"
          defaultValue={customerData?.email || ""}
          className="w-full border rounded p-2"
          disabled={isSubmitting}
        />
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Name <span className="text-gray-400 text-xs">（會當作帳號，選填）</span>
        </label>
        <input
          name="name"
          defaultValue={customerData?.name || ""}
          className="w-full border rounded p-2"
          disabled={isSubmitting}
        />
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-medium mb-1">Company Name</label>
        <input
          name="companyname"
          defaultValue={customerData?.companyname || ""}
          className="w-full border rounded p-2"
          disabled={isSubmitting}
        />
      </div>

      {/* Contact Name + Phone 並排 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Contact Name</label>
          <input
            name="contactname"
            defaultValue={customerData?.contactname || ""}
            className="w-full border rounded p-2"
            disabled={isSubmitting}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            name="phone"
            defaultValue={customerData?.phone || ""}
            className="w-full border rounded p-2"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* ⭐【修正重點】新增密碼欄位 */}
      <div>
        <label className="block text-sm font-medium mb-1">
          密碼
          {isEdit && (
            <span className="text-gray-400 text-xs font-normal ml-1">
              （留空則不修改）
            </span>
          )}
        </label>
        <input
          name="password"
          type="password"
          className="w-full border rounded p-2"
          disabled={isSubmitting}
          placeholder={isEdit ? "留空則不修改密碼" : "請輸入密碼"}
        />
      </div>

      {/* 按鈕區 */}
      <div className="pt-4 flex gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          disabled={isSubmitting}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-black text-white rounded flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "儲存修改" : "新增客戶"}
        </button>
      </div>
    </form>
  );
}
