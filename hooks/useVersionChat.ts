// hooks/useVersionChat.ts
"use client";

import { api } from "@/utils/api";
import { useState, useEffect, useCallback } from "react";

// 定義元件使用的訊息類型
interface Message {
  id: string;
  content: string;
  createdAt: Date;
  senderType: string;
  senderId: string;
  senderName: string;
  senderRole?: string | null;
}

interface UseVersionChatProps {
  versionId: string;
  customerId?: string | null;
}

// 類型保護函數
function isValidMessage(msg: any): msg is {
  id: string;
  content: string;
  createdAt: Date;
  senderType: string;
  senderId?: string;
  sender?: { id: string; name: string | null; role: string };
  senderCustomer?: { id: string; name: string | null; companyname: string | null };
  senderName?: string;
} {
  return msg && typeof msg.id === 'string' && typeof msg.content === 'string';
}

// 格式化訊息的輔助函數
const formatMessage = (msg: any): Message => {
  if (!isValidMessage(msg)) {
    console.error('Invalid message format:', msg);
    return {
      id: 'error',
      content: '訊息格式錯誤',
      createdAt: new Date(),
      senderType: 'unknown',
      senderId: '',
      senderName: '系統',
    };
  }

  const isCustomer = msg.senderType === "customer";
  let senderName = "";
  let senderRole = null;

  if (isCustomer && msg.senderCustomer) {
    senderName = msg.senderCustomer.name || msg.senderCustomer.companyname || "客戶";
  } else if (msg.sender) {
    senderName = msg.sender.name || "未知用戶";
    senderRole = msg.sender.role;
  } else if (msg.senderName) {
    senderName = msg.senderName;
  } else {
    senderName = isCustomer ? "客戶" : "業務";
  }

  // 獲取 senderId
  let senderId = msg.senderId || "";
  if (!senderId) {
    if (isCustomer && msg.senderCustomer) {
      senderId = msg.senderCustomer.id;
    } else if (msg.sender) {
      senderId = msg.sender.id;
    }
  }

  return {
    id: msg.id,
    content: msg.content,
    createdAt: msg.createdAt,
    senderType: msg.senderType,
    senderId,
    senderName,
    senderRole,
  };
};

// 獲取當前用戶
const getCurrentUser = (customerId?: string | null) => {
  if (typeof window !== "undefined") {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  }
  
  if (customerId) {
    return {
      id: customerId,
      type: "customer" as const,
      name: "客戶",
    };
  }
  return {
    id: "current-sales-id",
    type: "sales" as const,
    name: "業務",
  };
};

export function useVersionChat({ versionId, customerId }: UseVersionChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const currentUser = getCurrentUser(customerId);
  
  // 獲取對話記錄
  const { data: fetchedMessages, refetch, isLoading } = api.phase.getVersionMessages.useQuery(
    { versionId },
    { enabled: !!versionId }
  );

  // 發送訊息 mutation
  const sendMessageMutation = api.phase.sendVersionMessage.useMutation({
    onSuccess: (newMessage) => {
      const formattedMessage = formatMessage(newMessage);
      setMessages(prev => [...prev, formattedMessage]);
    },
  });

  // 更新 messages 當 fetchedMessages 變化
  useEffect(() => {
    if (fetchedMessages && Array.isArray(fetchedMessages)) {
      const formattedMessages = fetchedMessages.map(formatMessage);
      setMessages(formattedMessages);
    }
  }, [fetchedMessages]);

  // 發送訊息
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    await sendMessageMutation.mutateAsync({
      versionId,
      content: content.trim(),
      senderType: currentUser.type,
      senderId: currentUser.id,
    });
  }, [versionId, currentUser, sendMessageMutation]);

  return {
    messages,
    isLoading,
    isSending: sendMessageMutation.isPending,
    sendMessage,
    currentUser,
    refetch,
  };
}