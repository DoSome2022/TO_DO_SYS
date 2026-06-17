"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { UploadCloud, File as FileIcon, Loader2, Send } from "lucide-react";
import { trpc } from "../../../../../trpc/client";

export function UploadVersionForm({
  projectId,
  userId,
  onSuccess,
}: {
  projectId: string;
  userId: string;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const getPresignedUrl = trpc.oss.getPresignedUrl.useMutation();
  const createMutation = trpc.WorkVersion.createVersion.useMutation({
    onSuccess: () => {
      toast.success("版本建立成功！");
      setNote("");
      setSelectedFile(null);
      setUploadProgress(0);
      onSuccess();
    },
  });

  const uploadFileWithProgress = (url: string, file: File, contentType: string) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", contentType);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`上傳失敗，狀態碼: ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("網路中斷或上傳失敗"));
      xhr.send(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ⭐ 只要備註有填就可以送出（沒有檔案也可以）
    if (!note.trim()) {
      return toast.warning("請輸入版本備註");
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      let publicUrl: string | undefined;

      // ⭐ 如果有選檔案才上傳，沒有就直接略過
      if (selectedFile) {
        const { uploadUrl, publicUrl: url } = await getPresignedUrl.mutateAsync({
          fileName: selectedFile.name,
          contentType: selectedFile.type || "application/octet-stream",
        });
        await uploadFileWithProgress(uploadUrl, selectedFile, selectedFile.type || "application/octet-stream");
        publicUrl = url;
      }

      // 建立版本（沒有 versionName → 後端自動生成）
      await createMutation.mutateAsync({
        projectId,
        userId,
        note: note.trim(),
        contentUrl: publicUrl, // 沒選檔案就是 undefined
      });
    } catch (error: any) {
      toast.error(`失敗: ${error.message}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-semibold text-sm">建立新版本</h3>

      {/* ⭐ Textarea 是必填 */}
      <Textarea
        placeholder="版本備註（必填）例如：修正了登入頁的 RWD 問題"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={isUploading}
        rows={2}
      />

      {/* ⭐ 選擇檔案改成選填 */}
      <div className="border-2 border-dashed rounded-lg p-3 text-center hover:bg-muted/50 transition-colors">
        <Input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          disabled={isUploading}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-1 text-xs text-muted-foreground"
        >
          <FileIcon className="w-6 h-6 opacity-50" />
          <span>{selectedFile ? selectedFile.name : "點擊選擇檔案（選填）"}</span>
        </label>
      </div>

      {isUploading && selectedFile && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{uploadProgress === 100 ? "儲存資料中..." : "上傳進度"}</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isUploading || !note.trim()}>
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {selectedFile && uploadProgress < 100 ? "上傳中..." : "處理中..."}
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            送出版本 {selectedFile ? "(含檔案)" : "(僅備註)"}
          </>
        )}
      </Button>
    </form>
  );
}
