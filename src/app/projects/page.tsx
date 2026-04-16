


// app/projects/page.tsx
import { db } from "@/app/lib/prisma"; // 直接在 Server Component 讀取 DB

import { Plus } from "lucide-react";
import Link from "next/link";
import ProjectCard from "./[projectId]/_components/ProjectCard";

export const dynamic = 'force-dynamic'; // 確保每次都讀到最新資料

export default async function ProjectsPage() {
  // 取得所有專案 (實際開發時通常會根據登入者 ID 篩選)
  const projects = await db.project.findMany({
    orderBy: { createdAt: 'desc' },
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

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border border-dashed rounded-xl">
          <p className="text-gray-500 text-lg">目前沒有任何專案</p>
          <p className="text-gray-400 text-sm mt-2">點擊右上方按鈕建立您的第一個專案</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.title}
              description={project.description}
              // 這裡假設 DB 還沒算進度，暫時給隨機或預設值，實際專案可依 Phase 完成比例計算
              progress={Math.floor(Math.random() * 100)} 
              dueDate={project.endDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

