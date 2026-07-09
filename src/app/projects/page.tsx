// // app/projects/page.tsx
// import { db } from "@/app/lib/prisma";
// import { Plus } from "lucide-react";
// import Link from "next/link";
// import ProjectCard from "./[projectId]/_components/ProjectCard";

// export const dynamic = 'force-dynamic';

// export default async function ProjectsPage() {
//   // ✅ 包含 phases，才能算真實進度
//   const projects = await db.project.findMany({
//     include: {
//       phases: {
//         select: {
//           status: true, // 只需要 status 來算比例
//         },
//       },
//     },
//     orderBy: { createdAt: 'desc' },
//   });

//   return (
//     <div className="container mx-auto py-8 px-4 max-w-7xl">
//       <div className="flex justify-between items-center mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 tracking-tight">專案列表</h1>
//           <p className="text-gray-500 mt-1">管理所有進行中的專案與進度</p>
//         </div>
        
//         <Link 
//           href="/projects/new" 
//           className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
//         >
//           <Plus className="w-4 h-4" />
//           建立新專案
//         </Link>
//       </div>

//       {projects.length === 0 ? (
//         <div className="text-center py-20 bg-gray-50 border border-dashed rounded-xl">
//           <p className="text-gray-500 text-lg">目前沒有任何專案</p>
//           <p className="text-gray-400 text-sm mt-2">點擊右上方按鈕建立您的第一個專案</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {projects.map((project) => {
//             // ✅ 根據 phases 的完成度計算真實進度
//             const phases = project.phases;
//             const totalPhases = phases.length;
//             const completedPhases = phases.filter((p) => p.status === "COMPLETED").length;
//             const progress = totalPhases > 0
//               ? Math.round((completedPhases / totalPhases) * 100)
//               : 0;

//             return (
//               <ProjectCard
//                 key={project.id}
//                 id={project.id}
//                 name={project.title}
//                 description={project.description}
//                 progress={progress} // ✅ 現在是根據資料庫算出來的！
//                 dueDate={project.endDate}
//               />
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }



// app/projects/page.tsx
import { db } from "@/app/lib/prisma";
import { Plus } from "lucide-react";
import Link from "next/link";
import ProjectsClient from "./ProjectsClient";


export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  // ✅ 一次撈出所有 project（含 customer、sales、pm、phases）
  const projects = await db.project.findMany({
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          customname: true,
          companyname: true,
        },
      },
      sales: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      pm: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      phases: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // ✅ 計算進度
  const projectsWithProgress = projects.map((project) => {
    const phases = project.phases;
    const totalPhases = phases.length;
    const completedPhases = phases.filter((p) => p.status === "COMPLETED").length;
    const progress = totalPhases > 0
      ? Math.round((completedPhases / totalPhases) * 100)
      : 0;

    return {
      ...project,
      progress,
    };
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">專案列表</h1>
          <p className="text-gray-500 mt-1">管理所有進行中的專案與進度</p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          建立新專案
        </Link>
      </div>

      {/* 🆕 Client Component 處理所有互動 */}
      <ProjectsClient projects={projectsWithProgress as any} />
    </div>
  );
}
