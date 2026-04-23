"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "../../../../trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MyProjectsPage() {
  const { data: session, status } = useSession();

  const { data: projects, isLoading } = trpc.project.getMyProjects.useQuery(
    undefined,
    { enabled: status === "authenticated" }
  );

  if (status === "loading") {
    return <div className="p-8 text-slate-500">載入使用者資訊中...</div>;
  }

  if (!session?.user?.id) {
    return <div className="p-8 text-red-500">請先登入後再查看專案。</div>;
  }

  console.log("data:", projects , " -- End --");

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">我的專案</h1>
        <p className="text-slate-500 mt-1">點選專案進入群內對話。</p>
      </div>

      {isLoading ? (
        <div className="text-slate-500">載入中...</div>
      ) : !projects || projects.length === 0 ? (
        <div className="text-slate-400 text-center py-10 bg-white rounded-lg border border-dashed">
          目前沒有參與任何專案。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/mytasks/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">{project.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {project.pm && <Badge>PM: {project.pm.name}</Badge>}
                    {project.sales && <Badge variant="secondary">Sales: {project.sales.name}</Badge>}
                  </div>

                  {project.customer && (
                    <p className="text-sm text-slate-500">
                      客戶：{project.customer.name || project.customer.name || "未命名"}
                    </p>
                  )}

                    <p className="text-xs text-slate-400">
                      階段 {project._count.phases} 個 · 任務 {project._count.workItems} 個
                    </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
