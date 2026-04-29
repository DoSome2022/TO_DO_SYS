// components/sales/chat/ChatMessage.tsx

"use client";

import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { User, Building } from "lucide-react";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    senderType: string;
    senderName: string;
    senderRole: string;
    createdAt: Date;
    isCustomer: boolean;
  };
  isCurrentUser: boolean;
}

export function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isCurrentUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
        }`}
      >
        {/* 發送者名稱 - 非當前用戶且不是客戶時顯示 */}
        {!isCurrentUser && message.senderType !== "customer" && (
          <p className="text-xs mb-1 flex items-center gap-1 opacity-70">
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
        
        {/* 客戶名稱顯示 */}
        {!isCurrentUser && message.senderType === "customer" && (
          <p className="text-xs mb-1 flex items-center gap-1 opacity-70">
            <Building className="w-3 h-3" />
            {message.senderName}
            <span className="text-gray-500">(客戶)</span>
          </p>
        )}
        
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className="text-xs mt-1 opacity-70 text-right">
          {format(new Date(message.createdAt), "HH:mm", { locale: zhTW })}
        </p>
      </div>
    </div>
  );
}