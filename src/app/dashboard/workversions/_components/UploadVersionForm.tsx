"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress"; // 👈 引入 shadcn 進度條
import { toast } from "sonner";
import { UploadCloud, File as FileIcon, Loader2 } from "lucide-react";
import { trpc } from "../../../../../trpc/client";

export function UploadVersionForm({ projectId, userId, onSuccess }: { projectId: string, userId: string, onSuccess: () => void }) {
  const [versionName, setVersionName] = useState("");
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  // 👇 新增：追蹤上傳進度 (0 ~ 100)
  const [uploadProgress, setUploadProgress] = useState(0); 

  const getPresignedUrl = trpc.oss.getPresignedUrl.useMutation();
  const createMutation = trpc.WorkVersion.createVersion.useMutation({
    onSuccess: () => {
      toast.success("版本建立成功！");
      setVersionName(""); setNote(""); setSelectedFile(null);
      setUploadProgress(0); // 重置進度
      onSuccess();
    }
  });

  // 👇 將原生的 XMLHttpRequest 包裝成 Promise，並綁定進度條事件
  const uploadFileWithProgress = (url: string, file: File, contentType: string) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", contentType);

      // 🔥 這裡就是精準追蹤上傳進度的核心！
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(); // 上傳成功
        } else {
          reject(new Error(`上傳失敗，狀態碼: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("網路中斷或上傳失敗"));
      
      xhr.send(file); // 開始上傳
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionName || !selectedFile) return toast.warning("請填寫名稱並選擇檔案");

    try {
      setIsUploading(true);
      setUploadProgress(0); // 初始化進度

      // 第一步：取得上傳網址 (極快，通常不到 1 秒)
      const { uploadUrl, publicUrl } = await getPresignedUrl.mutateAsync({
        fileName: selectedFile.name,
        contentType: selectedFile.type || "application/octet-stream",
      });

      // 第二步：使用支援進度條的 XHR 進行大檔直傳
      await uploadFileWithProgress(
        uploadUrl, 
        selectedFile, 
        selectedFile.type || "application/octet-stream"
      );

      // 第三步：上傳到 100% 後，寫入資料庫
      await createMutation.mutateAsync({
        projectId,
        userId,
        versionName,
        contentUrl: publicUrl,
        note,
      });

    } catch (error: any) {
      toast.error(`上傳失敗: ${error.message}`);
      setUploadProgress(0); // 失敗時清空進度
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-sm">上傳新版本檔案</h3>
      
      <Input placeholder="版本名稱" value={versionName} onChange={(e) => setVersionName(e.target.value)} disabled={isUploading} />

      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
        <Input type="file" id="file-upload" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} disabled={isUploading} />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <FileIcon className="w-8 h-8 opacity-50" />
          <span>{selectedFile ? selectedFile.name : "點擊選擇檔案 (支援大容量)"}</span>
        </label>
      </div>

      <Textarea placeholder="版本備註" value={note} onChange={(e) => setNote(e.target.value)} disabled={isUploading} />

      {/* 🔥 即時進度條顯示區塊 */}
      {isUploading && (
        <div className="space-y-1 my-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{uploadProgress === 100 ? "儲存資料中..." : "上傳進度"}</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isUploading || !selectedFile}>
        {isUploading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {uploadProgress < 100 ? "上傳中..." : "處理中..."}</>
        ) : (
          "開始上傳"
        )}
      </Button>
    </form>
  );
}
