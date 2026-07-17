//src/components/sales/project/SalesCreateProjectClient.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// 替換為你的實際 tRPC client 路徑
import { trpc } from "../../../../trpc/client"; 

import SalesProjectForm, { SalesProjectFormValues } from "./SalesProjectForm";
import { toast } from "sonner";

export default function SalesCreateProjectClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 自動從 URL 抓取 ?customerId=...
  const defaultCustomerId = searchParams.get("customerId"); 

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 使用 tRPC 獲取原始資料 (Raw Data)
  const { data: pmCandidates = [] } = trpc.project.getPMCandidates.useQuery();
  const { data: rawCustomers = [] } = trpc.customer.getAllCustomer.useQuery(); 
  const { data: companies = [] } = trpc.companyProfile.getAll.useQuery();
  const { data: rawServices = [] } = trpc.service.getAll.useQuery();

  // 2. 資料清洗 (Data Mapping)：把後端的 Prisma 型別轉換成前端 UI 需要的乾淨型別
  const formattedCustomers = rawCustomers.map(c => ({
    id: c.id,
    // 如果 name 是 null，就退而求其次用 customname，如果都沒有就顯示 "未知客戶"
    name: c.name || c.customname || "未知客戶" 
  }));

  const formattedServices = rawServices.map(s => ({
    id: s.id,
    name: s.name,
    // 將 Prisma 的 Decimal 轉成前端的 number 型別
    price: Number(s.price) || 0 
  }));

  // ✅ 3. 解開建立專案的 API 封印
  const createProjectMutation = trpc.project.createProjectWithQuote.useMutation();

  const handleSubmit = async (data: SalesProjectFormValues) => {
    setIsSubmitting(true);
    try {
      console.log("準備送出的資料：", data);
      
      // ✅ 4. 實務上這裡呼叫 tRPC 送出資料 (會觸發剛寫好的 Prisma Transaction)
    const result = await createProjectMutation.mutateAsync(data);
    
    // ✨ 可以從 result.quotation.number 拿到剛剛產生的編號
    toast.success(`報價單已建立！編號：${result.quotation.number}`);
      
      // 成功後導向 Sales 的專案總覽頁
      router.push("/sales/projects"); 
      router.refresh();
    } catch (error) {
      toast.error("建立失敗，請稍後再試。");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 animate-in fade-in duration-500 font-sans">
      
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-[#201f1e]">新增專案與報價單</h1>
        <p className="text-[14px] text-[#605e5c] mt-1">
          請填寫專案範圍，並配置給客戶的報價項目。完成後可直接指派給 PM 進行後續排程。
        </p>
      </div>

      {/* 將清洗後的 formattedCustomers 與 formattedServices 傳給子元件 */}
      <SalesProjectForm 
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        defaultCustomerId={defaultCustomerId}
        pmCandidates={pmCandidates}
        customers={formattedCustomers}        // 👈 使用清洗後的資料
        companies={companies}
        availableServices={formattedServices} // 👈 使用清洗後的資料
      />

    </div>
  );
}
