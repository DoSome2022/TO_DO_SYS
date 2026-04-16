"use client";

import { useRef, useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { 
  useConversations, 
  useSendMessage, 
  // 請確認這個 Conversation 型別在你的 hooks 中有包含 senderType 屬性
  type Conversation  
} from "../../../hooks/useSalesCustomer";

interface CustomerChatListProps {
  customerId: string;
  customerName: string;
}

export default function CustomerChatList({ customerId, customerName }: CustomerChatListProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const {
    data: conversationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useConversations(customerId);

  const sendMessage = useSendMessage();

  // 合併所有頁面的對話記錄
  const allMessages = conversationsData?.pages.flatMap((page) => page.conversations) || [];

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 監聽滾動事件，顯示/隱藏滾動按鈕
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  // 當新訊息加入時，自動滾動到底部
  useEffect(() => {
    scrollToBottom();
  }, [allMessages.length]);

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessage.isPending) return;

    try {
      await sendMessage.mutateAsync({
        customerId,
        content: message,
      });
      setMessage("");
    } catch (error) {
      console.error("發送失敗", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const isToday = now.toDateString() === messageDate.toDateString();
    
    if (isToday) {
      return format(messageDate, "HH:mm", { locale: zhTW });
    }
    return format(messageDate, "MM/dd HH:mm", { locale: zhTW });
  };

  const formatMessageDate = (date: Date, index: number, messages: Conversation[]) => {
    const currentDate = new Date(date);
    const prevMessage = messages[index - 1];
    
    // 如果是第一則訊息，或與上一則訊息不同天，顯示日期分隔線
    if (!prevMessage || new Date(prevMessage.createdAt).toDateString() !== currentDate.toDateString()) {
      return (
        <div className="flex justify-center my-4">
          <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
            {format(currentDate, "yyyy年MM月dd日 EEEE", { locale: zhTW })}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* 對話記錄區域 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {/* 加載更多按鈕 */}
        {hasNextPage && (
          <div className="flex justify-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  載入中...
                </>
              ) : (
                "載入更多訊息"
              )}
            </Button>
          </div>
        )}

        {/* 訊息列表 */}
        <div className="space-y-3">
          {allMessages.map((msg, index) => {
            // ✨ 關鍵修改：使用資料庫真實傳回的 senderType 來判斷是否為業務自己發的
            // （如果型別定義暫時缺少 senderType，這裡加上 as any 作為安全機制）
            const isOwnMessage = (msg as any).senderType === "SALES"; 
            
            const dateSeparator = formatMessageDate(msg.createdAt, index, allMessages);

            return (
              <div key={msg.id}>
                {dateSeparator}
                <div className={`flex gap-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  {!isOwnMessage && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {customerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] ${
                      isOwnMessage
                        ? "bg-blue-500 text-white rounded-l-xl rounded-br-xl"
                        : "bg-white border rounded-r-xl rounded-bl-xl"
                    } p-3 shadow-sm`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? "text-blue-100" : "text-muted-foreground"
                      }`}
                    >
                      {formatMessageTime(msg.createdAt)}
                    </p>
                  </div>
                  {isOwnMessage && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-blue-500 text-white">
                        我
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* 輸入中指示器（當正在發送時顯示） */}
          {sendMessage.isPending && (
            <div className="flex justify-end gap-3">
              <div className="bg-blue-500 text-white border rounded-l-xl rounded-br-xl p-3 shadow-sm opacity-50">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-100 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-blue-100 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-blue-100 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-blue-500 text-white">
                  我
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 滾動到底部按鈕 */}
      {showScrollButton && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute bottom-24 right-6 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      )}

      {/* 輸入區域 */}
      <div className="border-t bg-background p-4 relative z-10">
        <div className="flex gap-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入訊息... (Enter 發送，Shift+Enter 換行)"
            className="flex-1 resize-none min-h-[80px]"
            rows={3}
            disabled={sendMessage.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={sendMessage.isPending || !message.trim()}
            className="self-end"
            size="icon"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          訊息將只對您與 {customerName} 可見，其他 Sales 無法查看
        </p>
      </div>
    </div>
  );
}
