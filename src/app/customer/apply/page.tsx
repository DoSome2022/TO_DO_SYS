// app/customer/apply/page.tsx (Client Component)

"use client";


import { Suspense } from "react";  // ← 加入這行
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { trpc } from "../../../../trpc/client";

type ApplicationFormData = {
  companyName: string;
  contactPhone: string;
  requirements: string;
};

// ── 把原本的元件改名 ──
function ApplicationFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const referenceId = searchParams.get("referenceId");

  // const { data: referenceData } = trpc.project.getProjectWithQuote.useQuery(
  //   { projectId: referenceId as string },
  //   { enabled: !!referenceId }
  // );

const { data: product } = trpc.project.getPublicProducts.useQuery(undefined, {
  enabled: !!referenceId,
  select: (products) => products.find((p) => p.id === referenceId),
});

  const form = useForm<ApplicationFormData>();

  const applyMutation = trpc.customer.submitApplication.useMutation({
    onSuccess: () => {
      alert("申請提交成功！我們將盡快與您聯繫。");
      form.reset();
      router.push("/customer/profile");
    },
    onError: (error) => {
      alert(`提交失敗: ${error.message}`);
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    applyMutation.mutate({
      ...data,
      referenceProjectId: referenceId,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-neutral-900 border border-neutral-800 rounded-lg">
      <h2 className="text-2xl text-amber-500 mb-6">發起合作申請</h2>

      {product && (
        <div className="mb-6 p-4 bg-neutral-950 border border-neutral-700 rounded text-sm text-neutral-400">
          <p>
            您參考的作品：
            <span className="text-white">{product.productName}</span>
          </p>

          {product.referencePrice && (
            <p>
              此類專案歷史預算區間：
              <span className="text-amber-400">
                ${Number(product.referencePrice).toLocaleString()}
              </span>{" "}
              起
            </p>
          )}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <input
          {...form.register("companyName")}
          placeholder="公司名稱 *"
          required
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

        <button
          type="submit"
          disabled={applyMutation.isPending}
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

// ── export default 用 Suspense 包裹 ──
export default function ApplicationForm() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">載入中...</p>
          </div>
        </div>
      }
    >
      <ApplicationFormContent />
    </Suspense>
  );
}
