// app/projects/[projectId]/_components/PhaseManager.tsx
"use client";

import { CheckCircle2, Circle, Layers, Loader2, Link as LinkIcon, Trash2, Eye } from "lucide-react";
import { trpc } from "../../../../../trpc/client";
import { toast } from "sonner";
import MeetingNotes from "./MeetingNotes";
import { useState, useRef } from "react";
import WorkVersionDetailModal from "./WorkVersionDetailModal";

// 新增：詳細資訊 Modal 元件（請確認路徑正確）


export default function PhaseManager({ projectId }: { projectId: string }) {
  // 抓取階段列表
  const { data: phases, refetch, isLoading } = trpc.phase.getPhasesByProjectId.useQuery({ projectId });

  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingPhaseId, setUploadingPhaseId] = useState<string | null>(null);
  const [showUrlInputForPhase, setShowUrlInputForPhase] = useState<string | null>(null);
  const [urlInputValue, setUrlInputValue] = useState("");

  // === 新增：用於顯示詳細資訊的 state ===
  const [selectedVersionForDetail, setSelectedVersionForDetail] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // OSS 簽名與建立 Deliverable
  const getSignature = trpc.Deliverable.getOssUploadSignature.useMutation();
  const createDeliverable = trpc.Deliverable.createDeliverable.useMutation({
    onSuccess: () => {
      utils.phase.getPhasesByProjectId.invalidate();
      toast.success("交付成品已成功新增");
    },
    onError: (err) => toast.error(err.message || "新增失敗"),
  });

  // 移除版本的 Mutation
  const removeVersionMutation = trpc.WorkVersion.removeVersionFromPhase.useMutation({
    onSuccess: () => {
      utils.phase.getPhasesByProjectId.invalidate();
      toast.success("已成功將版本移出階段，退回團隊產出池");
    },
    onError: (err) => {
      toast.error(err.message || "移除失敗，請稍後再試");
    },
  });

  // === 新增：開啟詳細 Modal 的處理函式 ===
  const handleViewVersionDetail = (version: any) => {
    setSelectedVersionForDetail(version);
    setIsDetailModalOpen(true);
  };

  // 處理檔案上傳
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, phaseId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhaseId(phaseId);

      const { uploadUrl, publicUrl, fileKey } = await getSignature.mutateAsync({ fileName: file.name });

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      await createDeliverable.mutateAsync({
        phaseId,
        name: file.name,
        url: publicUrl,
        fileKey,
        fileSize: file.size,
      });
    } catch (error) {
      console.error("上傳失敗", error);
      toast.error("檔案上傳失敗，請稍後再試");
    } finally {
      setUploadingPhaseId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 處理外部網址加入
  const handleAddUrl = async (phaseId: string) => {
    if (!urlInputValue.trim()) {
      toast.error("請輸入有效的網址");
      return;
    }

    try {
      await createDeliverable.mutateAsync({
        phaseId,
        name: urlInputValue.trim(),
        url: urlInputValue.trim(),
      });
    } catch (error) {
      console.error("加入連結失敗", error);
      toast.error("加入連結失敗，請稍後再試");
    }
  };

  // 新增階段
  const createPhaseMutation = trpc.phase.createPhase.useMutation({
    onSuccess: () => {
      toast.success("成功新增階段");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreatePhase = () => {
    const phaseName = prompt("請輸入新階段名稱 (例如: 第一階段、v2.0 等):", "新階段");
    if (!phaseName) return;

    createPhaseMutation.mutate({
      projectId,
      name: phaseName,
    });
  };

  // 移除版本處理函式
  const handleRemoveVersion = async (versionId: string, versionName: string) => {
    if (!confirm(`確定要將「${versionName}」從目前階段移除嗎？\n\n移除後該版本將退回團隊產出池，可供重新挑選。`)) {
      return;
    }

    try {
      await removeVersionMutation.mutateAsync({ versionId });
    } catch (error) {
      // 錯誤已在 onError 處理
    }
  };

  // === 切換階段狀態 ===
const toggleStatusMutation = trpc.phase.updatePhase.useMutation({
  onSuccess: () => {
    refetch();
    toast.success("階段狀態已更新");
  },
  onError: (err) => {
    toast.error(err.message || "更新失敗");
  },
});


// === 切換階段完成狀態 ===
const handleToggleStatus = (phaseId: string, currentStatus: string) => {
  const newStatus = currentStatus === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
  const actionText = newStatus === "COMPLETED" ? "標記為完成" : "退回進行中";

  if (newStatus === "IN_PROGRESS") {
    // 退回進行中：直接執行，不彈窗
    toggleStatusMutation.mutate({ id: phaseId, status: newStatus });
  } else {
    // 標記為完成：加上確認
    if (!confirm(`確定要將此階段「標記為完成」嗎？\n\n完成後專案進度會跟著更新。`)) return;
    toggleStatusMutation.mutate({ id: phaseId, status: newStatus });
  }
};


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          階段與交付管理
        </h2>
        <button
          onClick={handleCreatePhase}
          disabled={createPhaseMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1"
        >
          {createPhaseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          + 新增階段
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-sm">載入階段中...</p>
      ) : phases?.length === 0 ? (
        <p className="text-gray-500 text-sm bg-white p-4 rounded border text-center">
          目前還沒有任何階段，請點擊右上方新增。
        </p>
      ) : (
        phases?.map((phase) => (
          <div key={phase.id} className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-6">
            {/* 階段標題列 */}
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                {phase.status === "COMPLETED" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                <h3 className="font-semibold text-gray-800">{phase.name}</h3>
              </div>
{/* 狀態按鈕：點擊可直接切換完成/進行中 */}
            <button
              onClick={() => handleToggleStatus(phase.id, phase.status)}
              disabled={toggleStatusMutation.isPending}
              className={`text-xs px-2 py-1 rounded-full font-medium transition-all border ${
                phase.status === "COMPLETED"
                  ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                  : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
              } disabled:opacity-50`}
            >
              {toggleStatusMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin inline" />
              ) : phase.status === "COMPLETED" ? (
                "✅ 已完成"
              ) : (
                "⏳ 進行中"
              )}
            </button>

            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左側：產出與交付物 */}
              <div className="space-y-6">
                {/* 已納入的員工產出 - 修改重點：加入詳細按鈕與點擊卡片功能 */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">已納入的員工產出</h4>
                  <div className="space-y-2">
                    {phase.selectedVersions && phase.selectedVersions.length > 0 ? (
                      phase.selectedVersions.map((version) => {
                        const employeeName = version.user?.name || "未知員工";
                        const versionName = version.versionName || `版本 (ID: ${version.id.slice(0, 4)})`;

                        return (
                          <div
                            key={version.id}
                            className="p-3 text-sm border rounded bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group flex justify-between items-center"
                            onClick={() => handleViewVersionDetail(version)}
                          >
                            <div className="flex-1">
                              <span className="font-medium">{versionName}</span>
                              <span className="text-gray-400 text-xs ml-2">(由 {employeeName} 提供)</span>
                            </div>

                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* 查看詳細按鈕 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewVersionDetail(version);
                                }}
                                className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                詳細
                              </button>

                              {/* 移除按鈕 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveVersion(version.id, versionName);
                                }}
                                disabled={removeVersionMutation.isPending}
                                className="text-red-500 hover:text-red-600 text-xs flex items-center gap-1 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                移除
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-gray-400 p-2 border border-dashed rounded bg-gray-50/50 text-center">
                        此階段尚未納入任何員工產出
                      </div>
                    )}
                  </div>
                </div>

                {/* 提供給客戶的交付成品 */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">提供給客戶的交付成品</h4>

                  <div className="flex flex-col gap-3">
                    {/* 上傳檔案按鈕 */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, phase.id)}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhaseId === phase.id}
                      className="text-sm text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded w-full border-dashed hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploadingPhaseId === phase.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          上傳中...
                        </>
                      ) : (
                        <>
                          <Layers className="w-4 h-4" />
                          + 上傳檔案（合併報告、PDF 等）
                        </>
                      )}
                    </button>

                    {/* 加入外部網址按鈕 */}
                    <button
                      onClick={() => {
                        setShowUrlInputForPhase(showUrlInputForPhase === phase.id ? null : phase.id);
                        setUrlInputValue("");
                      }}
                      className="text-sm text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded w-full border-dashed hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      + 加入外部網址（Figma、Google Drive 等）
                    </button>

                    {/* URL 輸入框 */}
                    {showUrlInputForPhase === phase.id && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="url"
                          value={urlInputValue}
                          onChange={(e) => setUrlInputValue(e.target.value)}
                          placeholder="https://figma.com/..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => handleAddUrl(phase.id)}
                          disabled={!urlInputValue.trim()}
                          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          加入
                        </button>
                        <button
                          onClick={() => {
                            setShowUrlInputForPhase(null);
                            setUrlInputValue("");
                          }}
                          className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
                        >
                          取消
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 已上傳的交付成品列表 */}
                  {phase.deliverables && phase.deliverables.length > 0 && (
                    <div className="mt-4 space-y-1">
                      {phase.deliverables.map((doc) => (
                        <div
                          key={doc.id}
                          className="text-xs flex justify-between items-center p-2 bg-white border rounded hover:bg-gray-50 group"
                        >
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex-1 truncate"
                          >
                            {doc.name}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 右側：此階段討論區 */}
              <div className="border-l lg:pl-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">此階段討論與備忘</h4>
                <MeetingNotes phaseId={phase.id} />
              </div>
            </div>
          </div>
        ))
      )}

      {/* 新增：詳細資訊 Modal */}
      <WorkVersionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedVersionForDetail(null);
        }}
        version={selectedVersionForDetail}
      />
    </div>
  );
}