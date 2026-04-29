// app/sales/projects/[projectId]/chat/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "../../../../../../trpc/client";
import QuotationVersionSidebar from "@/components/sales/Message/QuotationVersionSidebar";
import SalesPMChat from "@/components/sales/Message/SalesPMChat";

export default function ProjectChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const { data: session } = useSession();

  // ✅ 1. 拿專案基本資料（不含 phases 細節）
  const { data: projects, isLoading: isProjectLoading } = trpc.project.getSalesProjects.useQuery();
  const project = projects?.find((p) => p.id === projectId);

  // ✅ 2. 另外呼叫 getPhasesByProjectId 拿完整的 phases（含 selectedVersions）
  const { data: phases, isLoading: isPhasesLoading } = trpc.phase.getPhasesByProjectId.useQuery(
    { projectId },
    { enabled: !!projectId } // 等有 projectId 才執行
  );

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // ✅ 3. 從 phases 取出所有 selectedVersions，展平成陣列
  const versions = (phases || [])
    .flatMap((phase) =>
      (phase as any).deliverables?.map((v: any) => ({
        ...v,
        phaseName: phase.name,
        phaseStatus: phase.status,
        phaseOrder: phase.order,
      })) || []
    );


    console.log(" Version Data : ",versions,"-- End --")

  if (isProjectLoading || isPhasesLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>專案不存在或你沒有權限</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/sales/projects")}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 頂部導航 */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b">
        <Button variant="ghost" size="sm" onClick={() => router.push("/sales/projects")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <div>
          <h1 className="text-lg font-bold">{project.title}</h1>
          <p className="text-sm text-muted-foreground">
            客戶：{project.customer?.name} ｜ PM：{project.pm?.name || "尚未指派"}
          </p>
        </div>
      </div>

      {/* 左右分割 */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* 左邊：階段版本列表 */}
        <div className="w-80 shrink-0 overflow-y-auto">
          <QuotationVersionSidebar
            versions={versions}
            selectedVersionId={selectedVersionId}
            onSelectVersion={setSelectedVersionId}
          />
        </div>

        {/* 右邊：對話框 */}
        <div className="flex-1">
          <SalesPMChat
            projectId={projectId}
            currentUserId={session?.user?.id || ""}
            currentUserRole={session?.user?.role || ""}
            pmName={project.pm?.name || null}
            salesName={session?.user?.name || null}
          />
        </div>
      </div>
    </div>
  );
}
