// app/projects/[projectId]/_components/MeetingNotes.tsx
"use client";

import { useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "../../../../../trpc/client"; // 請確認您的 trpc client 路徑

export default function MeetingNotes({ phaseId }: { phaseId: string }) {
  const [input, setInput] = useState("");

  // 1. 抓取此「階段」的真實留言
  const { data: notes, isLoading, refetch } = trpc.Comment.getCommentsByPhaseId.useQuery({ phaseId });

  // 2. 新增留言的 API
  const addNoteMutation = trpc.Comment.createComment.useMutation({
    onSuccess: () => {
      toast.success("已新增記錄");
      setInput("");
      refetch(); // 重新抓取資料
    },
    onError: (err) => {
      toast.error("新增失敗: " + err.message);
    }
  });

  const handleAddNote = () => {
    if (!input.trim()) return;
    addNoteMutation.mutate({ phaseId, content: input });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm flex flex-col h-[300px]">
      <div className="p-3 border-b flex items-center justify-between bg-yellow-50/50 rounded-t-md">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4 text-yellow-600" />
          此階段討論與回饋
        </h3>
        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
      </div>

      {/* 列表區域 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <p className="text-xs text-gray-400 text-center mt-5">載入中...</p>
        ) : !notes || notes.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-5">此階段尚無討論記錄</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-gray-50 border border-gray-100 p-2 rounded text-sm relative group">
              <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
              <span className="text-[10px] text-gray-400 mt-1 block">
                {new Date(note.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      {/* 輸入區域 */}
      <div className="p-2 border-t bg-white rounded-b-md">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="新增階段討論..."
            value={input}
            disabled={addNoteMutation.isPending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
          />
          <button 
            onClick={handleAddNote}
            disabled={addNoteMutation.isPending || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-1.5 px-3 rounded transition-colors"
          >
            {addNoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
