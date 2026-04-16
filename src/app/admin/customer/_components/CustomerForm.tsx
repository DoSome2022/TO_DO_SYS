"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { trpc } from "../../../../../trpc/client";

// 1. 定義 Zod Schema (您 package.json 已經有安裝 zod)
const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  companyname: z.string().optional(),
  contactname: z.string().optional(),
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
      router.refresh(); // 刷新 Server Component 列表
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

  // 3. 原生表單提交處理 (React 19 / 標準 HTML)
   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 取得表單內所有 input 的值
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());

    // 使用 Zod 驗證資料
    const parsed = formSchema.safeParse(rawData);
    
    if (!parsed.success) {
      // 改用 .issues 來取得錯誤陣列，並加上可選串連 (?.) 避免意外 crash
      toast.error(parsed.error.issues[0]?.message || "表單驗證失敗");
      return;
    }

    // 驗證成功，送出 Mutation
    // 注意：因為 Zod schema 中我們用了 .optional()，有些值可能是空字串
    // 我們可以在送出前確保空字串也被正確處理
    if (isEdit) {
      updateMut.mutate({ id: customerId!, ...parsed.data });
    } else {
      createMut.mutate(parsed.data);
    }
  };

  const isSubmitting = createMut.isPending || updateMut.isPending;

  // 如果是編輯模式且資料還在載入中
  if (isEdit && isFetching) {
    return <Loader2 className="animate-spin text-gray-500 my-10 mx-auto" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium mb-1">Email </label>
        <input 
          name="email"
          type="email"
          defaultValue={customerData?.email || ""}
          className="w-full border rounded p-2"
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Name(會當作帳號)</label>
        <input 
          name="name"
          defaultValue={customerData?.name || ""}
          className="w-full border rounded p-2" 
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Company Name</label>
        <input 
          name="companyname"
          defaultValue={customerData?.companyname || ""}
          className="w-full border rounded p-2" 
          disabled={isSubmitting}
        />
      </div>
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
