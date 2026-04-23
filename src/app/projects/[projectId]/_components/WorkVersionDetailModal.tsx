// app/projects/[projectId]/_components/WorkVersionDetailModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";   // 請確認 shadcn 已安裝 Dialog 元件
import { format } from "date-fns";
import { Calendar, User, FileText, Link as LinkIcon, Clock } from "lucide-react";

interface WorkVersionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: any;   // 來自 tRPC 的 WorkVersion 資料（含 user 與 phase）
}

export default function WorkVersionDetailModal({
  isOpen,
  onClose,
  version,
}: WorkVersionDetailModalProps) {
  if (!version) return null;

  const createdAtFormatted = version.createdAt
    ? format(new Date(version.createdAt), "yyyy-MM-dd HH:mm")
    : "未知";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            員工產出版本詳細資訊
          </DialogTitle>
          <DialogDescription>
            版本 ID: {version.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本資訊 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-2">版本名稱</h4>
            <p className="text-lg font-medium text-gray-900">{version.versionName}</p>
          </div>

          {/* 員工資訊 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <User className="w-4 h-4" />
                上傳員工
              </div>
              <p className="font-medium">{version.user?.name || "未知員工"}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                上傳時間
              </div>
              <p className="font-medium">{createdAtFormatted}</p>
            </div>
          </div>

          {/* 內容連結 */}
          {version.contentUrl && (
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <LinkIcon className="w-4 h-4" />
                內容連結 / 檔案
              </div>
              <a
                href={version.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all text-sm block p-3 bg-gray-50 rounded border"
              >
                {version.contentUrl}
              </a>
            </div>
          )}

          {/* 備註 */}
          {version.note && (
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <FileText className="w-4 h-4" />
                員工備註
              </div>
              <div className="p-3 bg-gray-50 rounded border text-sm whitespace-pre-wrap">
                {version.note}
              </div>
            </div>
          )}

          {/* 所屬階段（若有） */}
          {version.phase && (
            <div>
              <div className="text-sm text-gray-500 mb-1">目前所屬階段</div>
              <p className="font-medium">{version.phase.name}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
          >
            關閉
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}