"use client";

import { Loader2 } from "lucide-react";

export default function ProjectMessageList({
  comments,
  isLoading,
}: {
  comments?: any[];
  isLoading: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-10 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          載入訊息中...
        </div>
      ) : !comments || comments.length === 0 ? (
        <p className="text-center text-slate-400 py-10">目前尚無訊息</p>
      ) : (
        comments.map((msg) => (
          <div key={msg.id} className="border rounded-md p-3 bg-slate-50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">
                {msg.sender?.name || "匿名"}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(msg.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))
      )}
    </div>
  );
}
