"use client";
// app/customer/apply/page.tsx (Client Component)
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { trpc } from "../../../../trpc/client";

type ApplicationFormData = {
  companyName: string;
  contactPhone: string;
  requirements: string;
};

export default function ApplicationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const referenceId = searchParams.get("referenceId"); 

  const { data: referenceData } = trpc.project.getProjectWithQuote.useQuery(
    { projectId: referenceId as string },
    { enabled: !!referenceId }
  );

  const form = useForm<ApplicationFormData>();
  
  // ✨ 在這裡加入 onSuccess 和 onError 的處理
  const applyMutation = trpc.customer.submitApplication.useMutation({
    onSuccess: () => {
      alert("申請提交成功！我們將盡快與您聯繫。");
      form.reset(); // 清空表單
      // router.push("/customer/profile"); // 可選：成功後導向會員中心
    },
    onError: (error) => {
      // 顯示後端拋出的錯誤 (例如: "請填寫公司名稱" 或 "目前系統無可用的業務人員")
      alert(`提交失敗: ${error.message}`);
    }
  });

  const onSubmit = (data: ApplicationFormData) => {
    applyMutation.mutate({ 
      ...data, 
      referenceProjectId: referenceId 
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-neutral-900 border border-neutral-800 rounded-lg">
      <h2 className="text-2xl text-amber-500 mb-6">發起合作申請</h2>

      {referenceData && (
        <div className="mb-6 p-4 bg-neutral-950 border border-neutral-700 rounded text-sm text-neutral-400">
          <p>您參考的作品：<span className="text-white">{referenceData.title}</span></p>
          
          {referenceData.quotation?.customerPrice && (
            <p>此類專案歷史預算區間：<span className="text-amber-400">${Number(referenceData.quotation.customerPrice).toLocaleString()}</span> 起</p>
          )}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <input 
          {...form.register("companyName")} 
          placeholder="公司名稱 *" 
          required // 加上簡單的 HTML 驗證
          className="w-full bg-neutral-950 border-neutral-800 text-white p-3 rounded" 
        />
        <input 
          {...form.register("contactPhone")} 
          placeholder="聯絡電話 *" 
          required
          className="w-full bg-neutral-950 border-neutral-800 text-white p-3 rounded" 
        />
        <textarea 
          {...form.register("requirements")} 
          placeholder="請描述您的具體需求... *" 
          required
          className="w-full h-32 bg-neutral-950 border-neutral-800 text-white p-3 rounded" 
        />
        
        {/* ✨ 加上 Disabled 狀態與 Loading 文字 */}
        <button 
          type="submit" 
          disabled={applyMutation.isPending} // 防止重複點擊 (如果是舊版 tRPC 可能是 .isLoading)
          className={`w-full py-3 transition rounded font-medium ${
            applyMutation.isPending 
              ? "bg-neutral-600 text-neutral-400 cursor-not-allowed" 
              : "bg-amber-600 text-white hover:bg-amber-700"
          }`}
        >
          {applyMutation.isPending ? "提交中..." : "提交申請"}
        </button>
      </form>
    </div>
  );
}
