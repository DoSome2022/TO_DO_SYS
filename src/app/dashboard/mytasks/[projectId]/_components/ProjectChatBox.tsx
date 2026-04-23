"use client";

import ProjectMessageList from "./ProjectMessageList";
import ProjectMessageInput from "./ProjectMessageInput";
import { trpc } from "../../../../../../trpc/client";

export default function PhaseChatBox({ phaseId }: { phaseId: string }) {
  
  // 1. 改呼叫 CommentRouter 裡面的 getCommentsByPhaseId
  // ★ 加入 refetchInterval: 3000 (每 3 秒自動抓取新訊息)
  const { data: comments, isLoading, refetch } = trpc.Comment.getCommentsByPhaseId.useQuery(
    { phaseId },
    {
      refetchInterval: 3000, // 每 3 秒自動更新聊天室訊息！
    }
  );

  // 2. 改呼叫 CommentRouter 裡面的 createComment
  const createMutation = trpc.Comment.createComment.useMutation({
    onSuccess: () => {
      refetch(); // 送出後立刻刷新
    },
  });

  const handleSend = (content: string) => {
    // 這裡傳入的是 phaseId
    createMutation.mutate({ phaseId, content });
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm flex flex-col h-full">
      {/* 頂部標題 */}
      <div className="p-3 border-b bg-slate-50 rounded-t-lg">
         <h3 className="text-sm font-semibold text-slate-700">階段討論區</h3>
      </div>

      {/* 訊息列表 (沿用你原本寫好的元件) */}
      <ProjectMessageList comments={comments ?? []} isLoading={isLoading} />
      
      {/* 輸入框 (沿用你原本寫好的元件) */}
      <ProjectMessageInput
        onSend={handleSend}
        isPending={createMutation.isPending}
      />
    </div>
  );
}
