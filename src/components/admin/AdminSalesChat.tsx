"use client";

import { useState, useEffect, useRef } from "react";

import { ScrollArea } from "@radix-ui/react-scroll-area";
import {
  Loader2,
  Send,
  AlertCircle,
  MessageSquare,
  User,
  CheckCheck,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { api } from "@/utils/api";

// ─── Props ─────────────────────────────────────────
interface Props {
  projectId: string | null;
  projectTitle: string;
}

// ─── Component ─────────────────────────────────────
export default function AdminSalesChat({ projectId, projectTitle }: Props) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(0);

  // ── 取得當前用戶 ID（從 session） ──
  // 這裡假設有個 useSession hook，或從 context 拿
  // 你也可以用 trpc 的 utils.getContext 來拿
  // 簡單作法：getMe query
  const { data: currentUser } = api.user.getMyProfile.useQuery();
  const currentUserId = currentUser?.id;

  // ── tRPC Queries ──
  const {
    data: channel,
    isLoading,
    isError,
    error,
    refetch,
  } = api.projectSalesChannel.getChannel.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId } // 只在有 projectId 時才查
  );

  // ── tRPC Mutations ──
  const sendMessage = api.projectSalesChannel.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      refetch(); // 重新獲取訊息
    },
  });

  const markAsRead = api.projectSalesChannel.markAsRead.useMutation();

  // ── 自動滾動到底部 ──
  useEffect(() => {
    if (channel?.messages && channel.messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      prevMessageCountRef.current = channel.messages.length;
    }
  }, [channel?.messages]);

  // ── 標記已讀 ──
  useEffect(() => {
    if (projectId && channel?.messages) {
      const hasUnread = channel.messages.some(
        (m) => m.senderId !== currentUserId && !m.readAt
      );
      if (hasUnread) {
        markAsRead.mutate({ projectId });
      }
    }
  }, [projectId, channel?.messages?.length, currentUserId]);

  // ── 發送訊息 ──
  const handleSend = () => {
    if (!projectId || !newMessage.trim() || sendMessage.isPending) return;
    sendMessage.mutate({
      projectId,
      content: newMessage.trim(),
    });
  };

  // ── Enter 發送 ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── 如果未選擇專案 ──
  if (!projectId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <MessageSquare className="h-16 w-16 mx-auto mb-4" />
          <p className="text-lg">請從左側選擇一個專案</p>
          <p className="text-sm">開始與 Sales 的內部對話</p>
        </div>
      </div>
    );
  }

  // ── 載入中 ──
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ── 錯誤狀態 ──
  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
          <p className="text-red-500 font-medium">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-sm text-blue-500 hover:text-blue-600 underline"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  const messages = channel?.messages ?? [];

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* ─── Header ─── */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <h3 className="text-base font-semibold text-gray-900">{projectTitle}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Admin ↔ Sales 內部對話 · 僅管理員與負責 Sales 可觀看
        </p>
      </div>

      {/* ─── 訊息列表 ─── */}
      <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="h-12 w-12 mb-3" />
            <p className="text-sm">尚無對話記錄</p>
            <p className="text-xs mt-1">發送第一條訊息開始溝通</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMine = msg.sender.id === currentUserId;
              const isRead = !!msg.readAt;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] ${isMine ? "order-1" : "order-1"}`}>
                    {/* 發送者資訊 */}
                    <div
                      className={`flex items-center gap-2 mb-1 ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="text-xs text-gray-400">
                        {msg.sender.name}
                      </span>
                      {msg.sender.role === "ADMIN" && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                      {msg.sender.role !== "ADMIN" && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          Sales
                        </span>
                      )}
                    </div>

                    {/* 訊息泡泡 */}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? "bg-blue-500 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-900 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* 時間與已讀狀態 */}
                    <div
                      className={`flex items-center gap-1 mt-0.5 ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(msg.createdAt), "HH:mm", {
                          locale: zhTW,
                        })}
                      </span>
                      {isMine && (
                        <span className="text-[10px]">
                          {isRead ? (
                            <CheckCheck className="h-3 w-3 text-blue-500 inline" />
                          ) : (
                            <Check className="h-3 w-3 text-gray-400 inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* ─── 輸入區 ─── */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入訊息... (Enter 發送)"
            disabled={sendMessage.isPending}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                       placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-xl
                       hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center gap-2"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="text-sm font-medium hidden sm:inline">發送</span>
          </button>
        </div>
      </div>
    </div>
  );
}
