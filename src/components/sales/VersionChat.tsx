// components/sales/VersionChat.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, Building, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

import { Badge } from "../ui/badge";
import { trpc } from "../../../trpc/client";


interface Message {
  id: string;
  content: string;
  senderType: string;
  senderId: string;
  createdAt: Date;
  sender?: {
    id: string;
    name: string | null;
    role: string | null;
  } | null;
  senderCustomer?: {
    id: string;
    name: string | null;
    companyname: string | null;
  } | null;
}

interface VersionChatProps {
  versionId: string;
  versionName: string;
  customerId?: string | null;
}

export function VersionChat({ versionId, versionName, customerId }: VersionChatProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 獲取當前用戶資訊（這裡需要從您的 auth context 獲取）
  const currentUser = {
    id: customerId || "current-user-id",
    type: customerId ? "customer" : "sales",
    name: customerId ? "客戶" : "業務",
  };

  // 獲取對話記錄
const { data: messages, refetch } = trpc.phase.getVersionMessages.useQuery(
  { versionId },
  { enabled: !!versionId }
);


  // 發送訊息
  const sendMessageMutation = trpc.phase.sendVersionMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
    },
  });

  // 自動滾動到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      versionId,
      content: message.trim(),
      senderType: currentUser.type as "customer" | "sales" | "admin",
      senderId: currentUser.id,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            版本對話：{versionName}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {currentUser.type === "customer" ? "客戶視角" : "業務視角"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          針對此版本的討論，客戶與業務可以在此溝通
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        {/* 對話記錄區域 */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages && messages.length > 0 ? (
              messages.map((msg) => {
                const isCurrentUser = msg.sender?.id === currentUser.id;
                const isCustomer = msg.senderType === "customer";

                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className={isCustomer ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>
                        {isCustomer ? (
                          <Building className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 ${isCurrentUser ? "items-end" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {msg.senderName || (isCustomer
                            ? (msg.sender as { name?: string | null; companyname?: string | null })?.name || 
                              (msg.sender as { name?: string | null; companyname?: string | null })?.companyname || "客戶"
                            : msg.sender?.name || "業務")}

                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.createdAt), "HH:mm", { locale: zhTW })}
                        </span>
                      </div>
                      <div
                        className={`inline-block rounded-lg px-3 py-2 max-w-[80%] ${
                          isCurrentUser
                            ? "bg-blue-500 text-white"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">尚無對話記錄</p>
                <p className="text-sm text-muted-foreground mt-2">
                  發送第一則訊息開始討論
                </p>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* 輸入區域 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="輸入訊息... (按 Enter 發送，Shift+Enter 換行)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[80px] resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}