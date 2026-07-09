// src/app/admin/projects/page.tsx
// "use client";

// import { AdminProjectForm } from "@/components/project/adminprojectForm";
// import { AdminProjectTable } from "@/components/project/adminprojectTable";
// import { useProjects } from "../../../../hooks/use-projects";

// export default function AdminProjectsPage() {
//   const { 
//     projects, 
//     pmCandidates, 
//     isLoading, 
//     createProject, 
//     isCreating,
//     updateProject,
//     customers,
//     companies,
//     availableServices
//   } = useProjects();

//   return (
//     <div className="p-6 max-w-6xl mx-auto space-y-8">
//       <div>
//         <h1 className="text-2xl font-bold mb-4">專案管理</h1>
        
//         <div className="p-6 border rounded-xl bg-card shadow-sm">
//           <h2 className="text-lg font-semibold mb-4">建立新專案與報價單</h2>
//           <AdminProjectForm 
//             onSubmit={async (data) => {
//               await createProject({
//                 ...data,
//                 startDate: data.startDate ? new Date(data.startDate) : undefined,
//                 endDate: data.endDate ? new Date(data.endDate) : undefined,
//               });
//             }} 
//             isLoading={isCreating} 
            
//             // 👇 關鍵解法：在這裡通通加上 `?? []`
//             // 如果 tRPC 還在載入，資料是 undefined，就會傳入空陣列，TypeScript 就不會報錯了！
//             pmCandidates={pmCandidates ?? []}
//             customers={customers ?? []}
//             companies={companies ?? []}
//             availableServices={availableServices ?? []}
//           />
//         </div>
//       </div>

//       <div className="border rounded-xl p-4 bg-card shadow-sm">
//         <h2 className="text-lg font-semibold mb-4">專案清單</h2>
//             <AdminProjectTable 
//               projects={projects ?? []} 
//               isLoading={isLoading} 
//               onUpdateStatus={async (id, newStatus) => {
//                 if (confirm(`確定要將專案狀態更改為 ${newStatus} 嗎？`)) {
//                   await updateProject({ id, status: newStatus });
//                 }
//               }}
//               // 👇 加上這個新屬性
//               onTogglePublic={async (id, isPublic) => {
//                 const actionName = isPublic ? "公開上架" : "下架隱藏";
//                 if (confirm(`確定要將此作品 ${actionName} 嗎？`)) {
//                   // 傳遞 isPublicPortfolio 給後端更新
//                   await updateProject({ id, isPublicPortfolio: isPublic });
//                 }
//               }}
//             />
//       </div>
//     </div>
//   );
// }


"use client";

import { useState } from "react"; // 🆕 加入 useState
import { AdminProjectForm } from "@/components/project/adminprojectForm";
import { AdminProjectTable } from "@/components/project/adminprojectTable";
import { ProductPublishDialog } from "@/components/project/ProductPublishDialog"; // 🆕
import { useProjects } from "../../../../hooks/use-projects";
import { trpc } from "../../../../trpc/client"; // 🆕

export default function AdminProjectsPage() {
  const {
    projects,
    pmCandidates,
    isLoading,
    createProject,
    isCreating,
    updateProject,
    customers,
    companies,
    availableServices,
  } = useProjects();

  // 🆕 商品上架對話框狀態
  const [publishTarget, setPublishTarget] = useState<any>(null);
  const updateProductInfo = trpc.project.updateProductInfo.useMutation({
    onSuccess: () => {
      // 刷新列表
      window.location.reload();
    },
  });

  // 🆕 處理上架確認
  const handlePublishConfirm = async (data: {
    projectId: string;
    isPublicPortfolio: boolean;
    productName?: string;
    productDescription?: string;
    productCategory?: string;
  }) => {
    await updateProductInfo.mutateAsync(data);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">專案管理</h1>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <h2 className="text-lg font-semibold mb-4">建立新專案與報價單</h2>
          <AdminProjectForm
            onSubmit={async (data) => {
              await createProject({
                ...data,
                startDate: data.startDate
                  ? new Date(data.startDate)
                  : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
              });
            }}
            isLoading={isCreating}
            pmCandidates={pmCandidates ?? []}
            customers={customers ?? []}
            companies={companies ?? []}
            availableServices={availableServices ?? []}
          />
        </div>
      </div>

      <div className="border rounded-xl p-4 bg-card shadow-sm">
        <h2 className="text-lg font-semibold mb-4">專案清單</h2>
        <AdminProjectTable
          projects={projects ?? []}
          isLoading={isLoading}
          onUpdateStatus={async (id, newStatus) => {
            if (confirm(`確定要將專案狀態更改為 ${newStatus} 嗎？`)) {
              await updateProject({ id, status: newStatus });
            }
          }}
          // 🆕 修改：打開上架對話框而不是直接上架
          onTogglePublic={async (id, isPublic) => {
            if (isPublic) {
              // 要上架 → 打開對話框填寫商品資訊
              const project = projects?.find((p: any) => p.id === id);
              setPublishTarget(project);
            } else {
              // 要下架 → 直接下架
              if (confirm("確定要將此作品下架隱藏嗎？")) {
                await updateProductInfo.mutateAsync({
                  projectId: id,
                  isPublicPortfolio: false,
                });
              }
            }
          }}
        />
      </div>

      {/* 🆕 商品上架對話框 */}
      <ProductPublishDialog
        open={!!publishTarget}
        onOpenChange={(open) => {
          if (!open) setPublishTarget(null);
        }}
        project={publishTarget}
        onConfirm={handlePublishConfirm}
      />
    </div>
  );
}
