"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "../../../../../trpc/client";

import { Layers, MessageSquare } from "lucide-react";
import PhaseChatBox from "./_components/ProjectChatBox";

export default function ProjectChatPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const { data: session, status } = useSession();
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  // 1. 抓取專案基本資訊
  const { data: project, isLoading: isProjectLoading } = trpc.project.getProject.useQuery(
    { id: projectId },
    { enabled: status === "authenticated" && !!projectId }
  );

  // 2. 抓取該專案的所有階段 (Phases)
  // ★ 加入 refetchInterval: 5000 (每 5 秒自動去後端查一次有沒有新階段)
  const { data: phases, isLoading: isPhasesLoading } = trpc.phase.getPhasesByProjectId.useQuery(
    { projectId },
    { 
      enabled: !!projectId,
      refetchInterval: 5000, // 每 5 秒自動更新左側階段列表！
    }
  );

  // 當 phases 載入完成，且還沒有選中任何階段時，預設選中第一個
  useEffect(() => {
    if (phases && phases.length > 0 && !selectedPhaseId) {
      setSelectedPhaseId(phases[0].id);
    }
  }, [phases, selectedPhaseId]);

  if (status === "loading" || isProjectLoading) {
    return <div className="p-8 text-slate-500">載入中...</div>;
  }

  if (!project) {
    return <div className="p-8 text-red-500">找不到專案或您沒有權限。</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
        <p className="text-slate-500">專案階段討論區</p>
      </div>

      {/* 左右分欄設計 */}
      <div className="flex gap-6 flex-1 h-[70vh]">
        
        {/* 左側：階段 (Phases) 列表 */}
        <div className="w-1/4 bg-white border rounded-lg shadow-sm p-4 overflow-y-auto">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4 border-b pb-2">
            <Layers className="w-4 h-4" />
            專案階段 (版本)
          </h2>
          
          {isPhasesLoading ? (
             <p className="text-sm text-slate-400">載入階段中...</p>
          ) : !phases || phases.length === 0 ? (
             <p className="text-sm text-slate-400">PM 尚未建立任何階段。</p>
          ) : (
            <div className="space-y-2">
              {phases.map((phase) => (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhaseId(phase.id)}
                  className={`w-full text-left px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                    selectedPhaseId === phase.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200" // 選中時的樣式
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{phase.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white border">
                      {phase.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右側：選中階段的聊天框 */}
        <div className="w-3/4">
          {selectedPhaseId ? (
            <PhaseChatBox phaseId={selectedPhaseId} />
          ) : (
            <div className="bg-white border rounded-lg shadow-sm h-full flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
              <p>請在左側選擇一個階段來查看對話</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
