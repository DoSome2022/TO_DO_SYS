// components/staff/StaffProjectList.tsx
"use client";


import Link from "next/link";
import { FolderGit2, ArrowRight, CheckCircle2, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // 假設您有 shadcn 的進度條
import { trpc } from "../../../../../trpc/client";

export function StaffProjectList() {
  // 👇 改用您提供的 getMyProjects API (不需要再手動傳 userId，後端 ctx 已經處理了)
  const { data: projects, isLoading } = trpc.project.getMyProjects.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
        <FolderGit2 className="w-12 h-12 mb-4 opacity-50" />
        <p>您目前沒有參與任何專案，或尚未被指派任務。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div 
          key={project.id} 
          className="border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col"
        >
          {/* 專案標題與圖示 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FolderGit2 className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold line-clamp-1 flex-1">{project.title}</h2>
          </div>
          
          {/* 專案負責人資訊 (選填，可讓員工知道 PM 是誰) */}
          <div className="text-xs text-muted-foreground mb-4 flex gap-4">
            {project.pm && <span>PM: {project.pm.name}</span>}
            {project.customer && <span>客戶: {project.customer.name}</span>}
          </div>

          {/* 任務進度條 (因為您的 API 有回傳 progress 欄位，可以直接利用！) */}
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <ListTodo className="w-4 h-4" /> 任務進度
              </span>
              <span className="font-medium">{project.completedTasks} / {project.totalTasks}</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* 進入按鈕 */}
          <Button asChild className="w-full group">
            <Link href={`/dashboard/workversions/${project.id}`}>
              進入專案工作區 
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
