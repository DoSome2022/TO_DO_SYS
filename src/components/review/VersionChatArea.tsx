// components/review/VersionChatArea.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Send, User, Building, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { trpc } from "../../../trpc/client";

interface Message {
  id: string;
  content: string;
  senderType: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: Date;
  isCustomer: boolean;
}

// ✅ 修改：支援兩種 ID 類型
interface VersionChatAreaProps {
  versionId?: string;      // 可選：用於版本對話
  deliverableId?: string;  // 可選：用於交付成品對話
  versionName: string;
  projectTitle: string;
  phaseName: string;
  customerId: string;
  onClose: () => void;
}

export function VersionChatArea({
  versionId,
  deliverableId,
  versionName,
  projectTitle,
  phaseName,
  customerId,
  onClose,
}: VersionChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 判斷是版本對話還是交付成品對話
  const isDeliverableChat = !!deliverableId;
  const chatId = isDeliverableChat ? deliverableId! : versionId!;
  
  // ✅ 根據類型選擇不同的 tRPC queries
  const { data: versionMessages, isLoading: isLoadingVersion, refetch: refetchVersion } = 
    trpc.message.getVersionMessages.useQuery(
      { versionId: chatId, customerId },
      { enabled: !!versionId && !isDeliverableChat }
    );
    
  const { data: deliverableMessages, isLoading: isLoadingDeliverable, refetch: refetchDeliverable } = 
    trpc.message.getDeliverableMessages.useQuery(
      { deliverableId: chatId, customerId },
      { enabled: !!deliverableId && isDeliverableChat }
    );
  
  const messages = isDeliverableChat ? deliverableMessages : versionMessages;
  const isLoading = isDeliverableChat ? isLoadingDeliverable : isLoadingVersion;
  
  // ✅ 根據類型選擇不同的發送 mutation
  const { mutate: sendVersionMessage, isPending: isSendingVersion } = 
    trpc.message.sendVersionMessage.useMutation({
      onSuccess: () => {
        setMessageText("");
        refetchVersion();
      },
      onError: (error) => {
        console.error(error);
      },
    });
    
  const { mutate: sendDeliverableMessage, isPending: isSendingDeliverable } = 
    trpc.message.sendDeliverableMessage.useMutation({
      onSuccess: () => {
        setMessageText("");
        refetchDeliverable();
      },
      onError: (error) => {
        console.error(error);
      },
    });
  
  const sendMessage = (content: string) => {
    if (isDeliverableChat) {
      sendDeliverableMessage({ deliverableId: chatId, content, customerId });
    } else {
      sendVersionMessage({ versionId: chatId, content, customerId });
    }
  };
  
  const isSending = isSendingVersion || isSendingDeliverable;
  
  const refetch = () => {
    if (isDeliverableChat) {
      refetchDeliverable();
    } else {
      refetchVersion();
    }
  };
  
  // 自動滾動到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // 每 3 秒自動刷新
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [refetch]);
  
  const handleSend = () => {
    if (!messageText.trim() || isSending) return;
    sendMessage(messageText);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  const fullTitle = `${projectTitle} - ${phaseName} - ${versionName}`;
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* 標題列 */}
      <div className="border-b px-4 py-3 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h3 className="font-semibold text-sm">{fullTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {isDeliverableChat ? "與 PM/業務對話" : "與業務對話"}
            </p>
          </div>
        </div>
      </div>
      
      {/* 訊息列表 */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages?.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">尚無對話記錄</p>
              <p className="text-sm text-muted-foreground mt-2">
                {isDeliverableChat 
                  ? "針對此交付成品提出您的意見或問題，PM 會盡快回覆"
                  : "針對此版本提出您的意見或問題，業務會盡快回覆"}
              </p>
            </div>
          ) : (
            messages?.map((message: Message) => (
              <div
                key={message.id}
                className={`flex ${message.isCustomer ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.isCustomer
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {/* 發送者名稱（非客戶時顯示） */}
                  {!message.isCustomer && (
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {message.senderName}
                      {message.senderRole === "SALES" && (
                        <span className="ml-1 text-blue-500">(業務)</span>
                      )}
                      {message.senderRole === "PM" && (
                        <span className="ml-1 text-purple-500">(PM)</span>
                      )}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {format(new Date(message.createdAt), "HH:mm MM/dd", { locale: zhTW })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* 輸入區域 */}
      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入您的意見或問題... (Enter 發送，Shift+Enter 換行)"
            className="flex-1 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={2}
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={isSending || !messageText.trim()}
            className="h-auto px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}