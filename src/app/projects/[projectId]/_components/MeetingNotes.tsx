// app/projects/[projectId]/_components/MeetingNotes.tsx
"use client";

import { useState } from "react";
import { MessageSquare, Send, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "../../../../../trpc/client";

type CommentWithSender = {
  id: string;
  content: string;
  createdAt: Date;
  sender?: {
    id: string;
    name: string | null;
    position?: string | null;
  } | null;
};

export default function MeetingNotes({ phaseId }: { phaseId: string }) {
  const [input, setInput] = useState("");

  // 1. 抓取此階段的留言，並包含發言者資訊
  const { 
    data: notes = [], 
    isLoading, 
    refetch 
  } = trpc.Comment.getCommentsByPhaseId.useQuery(
    { phaseId },
    {
      // 建議加入 select 或在後端已經 include sender
    }
  );

  // 2. 新增留言的 API
  const addNoteMutation = trpc.Comment.createComment.useMutation({
    onSuccess: () => {
      toast.success("已新增討論記錄");
      setInput("");
      refetch();
    },
    onError: (err) => {
      toast.error(`新增失敗: ${err.message}`);
    },
  });

  const handleAddNote = () => {
    if (!input.trim()) return;
    
    addNoteMutation.mutate({ 
      phaseId, 
      content: input.trim() 
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm flex flex-col h-[320px]">
      <div className="p-3 border-b flex items-center justify-between bg-yellow-50/50 rounded-t-md">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4 text-yellow-600" />
          此階段討論與回饋
        </h3>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {/* 留言列表區域 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="text-xs text-gray-400 text-center mt-8">載入討論中...</div>
        ) : notes.length === 0 ? (
          <div className="text-xs text-gray-400 text-center mt-8">此階段尚無討論記錄</div>
        ) : (
          notes.map((note: CommentWithSender) => {
            const senderName = note.sender?.name || "系統";
            const senderPosition = note.sender?.position ? `・${note.sender.position}` : "";

            return (
              <div 
                key={note.id} 
                className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-sm"
              >
                {/* 發言者資訊 */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{senderName}</span>
                    {senderPosition && (
                      <span className="text-xs text-gray-500">{senderPosition}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {new Date(note.createdAt).toLocaleString("zh-TW", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* 留言內容 */}
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* 輸入區域 */}
      <div className="p-3 border-t bg-white rounded-b-md">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="新增階段討論或回饋..."
            value={input}
            disabled={addNoteMutation.isPending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
          />
          <button 
            onClick={handleAddNote}
            disabled={addNoteMutation.isPending || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2.5 rounded-md transition-colors flex items-center gap-2"
          >
            {addNoteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                傳送
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}