"use client";

import { useState } from "react";

import { VersionListSidebar } from "./VersionListSidebar";
import { VersionContentPreview } from "./VersionContentPreview";
import { UploadVersionForm } from "./UploadVersionForm";
import { useSession } from "next-auth/react";
import { trpc } from "../../../../../trpc/client";

interface VersionDashboardProps {
  projectId: string;
}

export function VersionDashboard({ projectId }: VersionDashboardProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string;

  // 狀態：目前員工點選查看的哪一個版本
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // 假設您在 tRPC router 中有寫一個 query 來獲取該員工在該專案的所有版本
  // const { data: versions, refetch } = trpc.workVersion.getStaffVersions.useQuery({ projectId, userId });
  
  // 這裡暫時用您提供的 getUnassignedVersions 作為範例 (實務上建議過濾 userId)
  const { data: versions, refetch } = trpc.WorkVersion.getUnassignedVersions.useQuery({ projectId });

  const selectedVersion = versions?.find((v) => v.id === selectedVersionId);

  return (
    <div className="flex h-[calc(100vh-100px)] w-full gap-4 p-4">
      {/* 區塊 1 & 3 & 4: 左側側邊欄 (包含列表與上傳操作) */}
      <div className="w-1/3 flex flex-col border rounded-lg bg-card shadow-sm overflow-hidden">
        
        {/* 區塊 3 & 4: 上傳文件按鈕 & 提交給 PM (表單) */}
        <div className="p-4 border-b bg-muted/30">
          <UploadVersionForm 
            projectId={projectId} 
            userId={userId} 
            onSuccess={() => refetch()} 
          />
        </div>

        {/* 區塊 1: 文件(版本)列表 */}
        <div className="flex-1 overflow-y-auto p-2">
          <VersionListSidebar 
            versions={versions || []} 
            selectedId={selectedVersionId}
            onSelect={setSelectedVersionId}
          />
        </div>
      </div>

      {/* 區塊 2: 右側主要內容區塊 (預覽文件內容) */}
      <div className="w-2/3 border rounded-lg bg-card shadow-sm p-4 flex flex-col">
        {selectedVersion ? (
          <VersionContentPreview version={selectedVersion} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            請從左側列表選擇一個版本，或上傳新版本。
          </div>
        )}
      </div>
    </div>
  );
}
