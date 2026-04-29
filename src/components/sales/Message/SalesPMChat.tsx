// src/components/SalesPMChat.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2, Send, User, MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useProjectMessages, useSendProjectMessage } from "../../../../hooks/useProjectChat";


type Props = {
  projectId: string;
  currentUserId: string;
  currentUserRole: string;
  pmName: string | null;
  salesName: string | null;
};

export default function SalesPMChat({
  projectId,
  currentUserId,
  currentUserRole,
  pmName,
  salesName,
}: Props) {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useProjectMessages(projectId);
  const sendMutation = useSendProjectMessage();

  // 自動捲到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || sendMutation.isPending) return;
    sendMutation.mutate({
      projectId,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  const getSenderName = (sender: { id: string; name: string | null; role: string }) => {
    if (sender.role === "PM" || sender.role === "ADMIN") return sender.name || "PM";
    if (sender.role === "SALES") return sender.name || "Sales";
    return sender.name || "未知";
  };

  const getSenderInitial = (name: string | null) => {
    return name?.charAt(0) || "?";
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-sm">Sales ↔ PM 對話</h3>
            <p className="text-xs text-muted-foreground">
              {salesName || "Sales"} 與 {pmName || "PM"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">尚無對話紀錄</p>
            <p className="text-xs mt-1">開始與 PM 討論專案細節吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const senderName = getSenderName(msg.sender);

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className={isMe ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                      {getSenderInitial(senderName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Bubble */}
                  <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{senderName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.createdAt), "MM/dd HH:mm", { locale: zhTW })}
                      </span>
                    </div>
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        isMe
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-900 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="輸入訊息..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={sendMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
