// app/projects/[projectId]/_components/PhaseManager.tsx
"use client";

import { CheckCircle2, Circle, Layers, Loader2 } from "lucide-react";
import { trpc } from "../../../../../trpc/client";
import { toast } from "sonner";
import MeetingNotes from "./MeetingNotes"; // 引入剛才修改好的元件
import { useState, useRef } from "react";

export default function PhaseManager({ projectId }: { projectId: string }) {
  // 抓取列表
  const { data: phases, refetch, isLoading } = trpc.phase.getPhasesByProjectId.useQuery({ projectId });

  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhaseId, setUploadingPhaseId] = useState<string | null>(null);

  // 取得上傳簽名
  const getSignature = trpc.Deliverable.getOssUploadSignature.useMutation();
  // 寫入資料庫
  const createDeliverable = trpc.Deliverable.createDeliverable.useMutation({
    onSuccess: () => {
      utils.phase.getPhasesByProjectId.invalidate(); // 刷新畫面
    }
  });
// 處理檔案選擇與上傳
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, phaseId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhaseId(phaseId);
      
      // 1. 向後端要阿里雲 OSS 的直傳 URL
      const { uploadUrl, publicUrl, fileKey  } = await getSignature.mutateAsync({ fileName: file.name });

      // 2. 用 PUT 方法直接把檔案丟給阿里雲
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // 3. 上傳成功後，把檔名和網址存進資料庫的 Deliverable 表
      await createDeliverable.mutateAsync({
        phaseId: phaseId,
        name: file.name,
        url: publicUrl,
        fileKey: fileKey,       // ★ 存入 OSS 的 Key
        fileSize: file.size,    // ★ 存入檔案大小
      });

      alert("上傳成功！");
    } catch (error) {
      console.error("上傳失敗", error);
      alert("上傳失敗，請稍後再試");
    } finally {
      setUploadingPhaseId(null);
      // 清空 input 讓下次可以選同一個檔案
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 新增階段 Mutation (假設您的 API 有 createPhase)
  // 如果還沒寫 createPhase，請在 server/routers/phase.ts 中補上
  const createPhaseMutation = trpc.phase.createPhase.useMutation({
    onSuccess: () => {
      toast.success("成功新增階段");
      refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  const handleCreatePhase = () => {
    const phaseName = prompt("請輸入新階段名稱 (例如: 第一階段、v2.0 等):", "新階段");
    if (!phaseName) return;
    
    createPhaseMutation.mutate({
      projectId: projectId,
      name: phaseName,
    });
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
        <p className="text-gray-500 text-sm bg-white p-4 rounded border text-center">目前還沒有任何階段，請點擊右上方新增。</p>
      ) : (
        phases?.map(phase => (
          <div key={phase.id} className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-6">
            {/* 階段標題列 */}
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                {phase.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                <h3 className="font-semibold text-gray-800">{phase.name}</h3>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                {phase.status || 'IN_PROGRESS'}
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左側：產出與交付物 */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">已納入的員工產出</h4>
                  <div className="space-y-2">
                    {/* ★ 判斷如果有資料就 map 渲染，沒有就顯示提示 */}
                    {phase.selectedVersions && phase.selectedVersions.length > 0 ? (
                      phase.selectedVersions.map((version) => {
                        // 防呆處理：確保名字不會是 null
                        const employeeName = version.user?.name || "未知員工";
                        const versionName = version.versionName || `版本 (ID: ${version.id.slice(0, 4)})`;

                        return (
                          <div key={version.id} className="p-2 text-sm border rounded bg-gray-50 flex justify-between items-center group">
                            <span>{versionName} <span className="text-gray-400 text-xs">(由 {employeeName} 提供)</span></span>
                            <button 
                              // TODO: 這裡可以加上移除產出的 mutation onClick
                              className="text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              移除
                            </button>
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

 <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">提供給客戶的交付成品</h4>
                  
                  {/* ★ 隱藏的檔案選擇器 */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, phase.id)}
                  />
                  
                  {/* ★ 點擊按鈕時觸發隱藏的 input */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhaseId === phase.id}
                    className="text-sm text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded w-full border-dashed hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {uploadingPhaseId === phase.id ? "上傳中..." : "+ 上傳給客戶的合併報告/檔案"}
                  </button>
                  
                  {/* (選做) 顯示目前這個 phase 已上傳的 deliverables */}
                  {phase.deliverables && phase.deliverables.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {phase.deliverables.map(doc => (
                        <div key={doc.id} className="text-xs flex justify-between p-2 bg-white border rounded">
                           <a href={doc.url} target="_blank" className="text-blue-500 hover:underline">{doc.name}</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ★ 右側：把該階段專屬的討論區放在這裡！ */}
              <div className="border-l lg:pl-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">此階段討論與備忘</h4>
                <MeetingNotes phaseId={phase.id} />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
