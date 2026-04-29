// // src/app/projects/[projectId]/page.tsx
// import { db } from "@/app/lib/prisma";
// import { notFound } from "next/navigation";

// import EmployeeWorkPool from "./_components/EmployeeWorkPool";
// import PhaseManager from "./_components/PhaseManager";
// import ProjectTeamManager from "./_components/ProjectTeamManager";
// import ProjectHeader from "./_components/ProjectHeader";
// // ★ 引入新的服務清單元件
// import ProjectPurchasedServices from "./_components/ProjectPurchasedServices";

// interface PageProps {
//   params: Promise<{
//     projectId: string;
//   }>;
// }

// export default async function ProjectDetailPage({ params }: PageProps) {
//   const { projectId } = await params;

//   const project = await db.project.findUnique({
//     where: { id: projectId }, 
//   });

//   if (!project) {
//     notFound();
//   }

//   return (
//     <div className="min-h-screen bg-gray-50/50 pb-20">
//       <ProjectHeader project={project} />

//       <main className="container mx-auto px-4 max-w-7xl mt-8">
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
//           {/* 左側主欄位 (佔 8/12) */}
//           <div className="lg:col-span-8 space-y-8">
            
//             {/* ★ 在最上方顯示客戶買了什麼服務 (專案工作內容) */}
//             <section>
//               <ProjectPurchasedServices projectId={projectId} />
//             </section>

//             {/* 這裡依然保留您原本的 PhaseManager */}
//             <section>
//               <PhaseManager projectId={projectId} />
//             </section>
            
//           </div>

//           {/* 右側側邊欄 (佔 4/12) */}
//           <div className="lg:col-span-4 space-y-8">
//             <section>
//               <ProjectTeamManager projectId={projectId} />
//             </section>
            
//             <section>
//               <EmployeeWorkPool projectId={projectId} />
//             </section>
//           </div>

//         </div>
//       </main>
//     </div>
//   );
// }


// src/app/projects/[projectId]/page.tsx
import { db } from "@/app/lib/prisma";
import { notFound } from "next/navigation";

import EmployeeWorkPool from "./_components/EmployeeWorkPool";
import PhaseManager from "./_components/PhaseManager";
import ProjectTeamManager from "./_components/ProjectTeamManager";
import ProjectHeader from "./_components/ProjectHeader";
import ProjectPurchasedServices from "./_components/ProjectPurchasedServices";
import PmSalesChatPanel from "./_components/PmSalesChatPanel";
// ★ 引入新的對話面板


interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = await params;

  // ✅ 擴充查詢：帶入 sales 和 pm 關聯（之後給聊天用）
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      sales: { select: { id: true, name: true } },
      pm: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <ProjectHeader project={project} />

      <main className="container mx-auto px-4 max-w-7xl mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 左側主欄位 (佔 8/12) */}
          <div className="lg:col-span-8 space-y-8">
            <section>
              <ProjectPurchasedServices projectId={projectId} />
            </section>
            <section>
              <PhaseManager projectId={projectId} />
            </section>
          </div>

          {/* 右側側邊欄 (佔 4/12) */}
          <div className="lg:col-span-4 space-y-8">
            <section>
              <ProjectTeamManager projectId={projectId} />
            </section>

            {/* ★ 新增：PM ↔ Sales 對話面板 */}
            <section>
              <PmSalesChatPanel
                projectId={projectId}
                pmName={project.pm?.name ?? null}
                salesName={project.sales?.name ?? null}
              />
            </section>

            <section>
              <EmployeeWorkPool projectId={projectId} />
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
