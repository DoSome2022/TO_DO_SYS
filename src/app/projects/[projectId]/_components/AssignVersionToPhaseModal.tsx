// app/projects/[projectId]/_components/AssignVersionToPhaseModal.tsx
"use client";

import { useState } from "react";
import { trpc } from "../../../../../trpc/client";
import { toast } from "sonner";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  versionId: string;
  versionName: string;
  projectId: string;        // 用來取得該專案的所有階段
  onSuccess?: () => void;
};

export default function AssignVersionToPhaseModal({
  isOpen,
  onClose,
  versionId,
  versionName,
  projectId,
  onSuccess,
}: Props) {
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const router = useRouter();

  const { data: phases = [] } = trpc.phase.getPhasesByProjectId.useQuery(
    { projectId },
    { enabled: isOpen }
  );

  const assignMutation = trpc.phase.assignVersionToPhase.useMutation({
    onSuccess: () => {
      toast.success(`已成功將「${versionName}」加入階段`);
      onSuccess?.();
      onClose();
      setSelectedPhaseId("");
      
      // 加入 F5 刷新效果
    //   router.refresh(); // 刷新 Server Component 資料
      // 或者使用 window.location.reload() 進行完整頁面刷新
      window.location.reload();
    },
    onError: (err) => {
      toast.error(`操作失敗: ${err.message}`);
    },
  });

  const handleAssign = () => {
    if (!selectedPhaseId) return;
    assignMutation.mutate({ versionId, phaseId: selectedPhaseId });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold">挑選版本放入階段</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">版本名稱</p>
            <p className="font-medium">{versionName}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">請選擇要放入的階段</label>
            <select
              value={selectedPhaseId}
              onChange={(e) => setSelectedPhaseId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">請選擇階段...</option>
              {phases.map((phase: any) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name} {phase.status === "COMPLETED" ? "(已完成)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            取消
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedPhaseId || assignMutation.isPending}
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {assignMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            確認放入階段
          </button>
        </div>
      </div>
    </div>
  );
}