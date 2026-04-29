// hooks/useDeliverableChat.ts
// "use client";

// import { api } from "@/utils/api";
// import { useState, useEffect, useCallback } from "react";

// interface Message {
//   id: string;
//   content: string;
//   createdAt: Date;
//   senderType: string;
//   senderId: string;
//   senderName: string;
//   senderRole?: string | null;
// }

// interface UseDeliverableChatProps {
//   deliverableId: string;
//   customerId?: string | null;
// }

// // 格式化訊息
// const formatMessage = (msg: any): Message => {
//   const isCustomer = msg.senderType === "customer";
//   let senderName = "";
//   let senderRole = null;

//   if (isCustomer && msg.senderCustomer) {
//     senderName = msg.senderCustomer.name || msg.senderCustomer.companyname || "客戶";
//   } else if (msg.sender) {
//     senderName = msg.sender.name || "未知用戶";
//     senderRole = msg.sender.role;
//   } else if (msg.senderName) {
//     senderName = msg.senderName;
//   } else {
//     senderName = isCustomer ? "客戶" : "業務";
//   }

//   let senderId = msg.senderId || "";
//   if (!senderId) {
//     if (isCustomer && msg.senderCustomer) {
//       senderId = msg.senderCustomer.id;
//     } else if (msg.sender) {
//       senderId = msg.sender.id;
//     }
//   }

//   return {
//     id: msg.id,
//     content: msg.content,
//     createdAt: msg.createdAt,
//     senderType: msg.senderType,
//     senderId,
//     senderName,
//     senderRole,
//   };
// };

// // 獲取當前用戶
// const getCurrentUser = (customerId?: string | null) => {
//   if (typeof window !== "undefined") {
//     const storedUser = localStorage.getItem("currentUser");
//     if (storedUser) {
//       return JSON.parse(storedUser);
//     }
//   }
  
//   if (customerId) {
//     return {
//       id: customerId,
//       type: "customer" as const,
//       name: "客戶",
//     };
//   }
//   return {
//     id: "current-sales-id",
//     type: "sales" as const,
//     name: "業務",
//   };
// };

// export function useDeliverableChat({ deliverableId, customerId }: UseDeliverableChatProps) {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const currentUser = getCurrentUser(customerId);
  
//   // 獲取交付成品的對話記錄
//   const { data: fetchedMessages, refetch, isLoading } = api.Deliverable.getDeliverableMessages.useQuery(
//     { deliverableId },
//     { enabled: !!deliverableId }
//   );

//   // 發送訊息 mutation
//   const sendMessageMutation = api.Deliverable.sendDeliverableMessage.useMutation({
//     onSuccess: (newMessage) => {
//       const formattedMessage = formatMessage(newMessage);
//       setMessages(prev => [...prev, formattedMessage]);
//       refetch();
//     },
//   });

//   // 更新 messages
//   useEffect(() => {
//     if (fetchedMessages && Array.isArray(fetchedMessages)) {
//       const formattedMessages = fetchedMessages.map(formatMessage);
//       setMessages(formattedMessages);
//     }
//   }, [fetchedMessages]);

//   // 發送訊息
//   const sendMessage = useCallback(async (content: string) => {
//     if (!content.trim()) return;
    
//     await sendMessageMutation.mutateAsync({
//       deliverableId,
//       content: content.trim(),
//       senderType: currentUser.type,
//       senderId: currentUser.id,
//     });
//   }, [deliverableId, currentUser, sendMessageMutation]);

//   return {
//     messages,
//     isLoading,
//     isSending: sendMessageMutation.isPending,
//     sendMessage,
//     currentUser,
//     refetch,
//   };
// }



import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { useSession } from "next-auth/react";

interface UseDeliverableChatProps {
  deliverableId: string;
  customerId?: string | null;
}

export function useDeliverableChat({ deliverableId, customerId }: UseDeliverableChatProps) {
  const { data: session } = useSession();
  
  // 獲取當前用戶資訊
  const currentUser = {
    id: session?.user?.id || "",
    name: session?.user?.name || "業務",
    type: session?.user?.role === "SALES" ? "sales" : "customer",
    role: session?.user?.role,
  };

  // 獲取對話訊息
  const { data: messages, isLoading, refetch } = api.message.getDeliverableMessages.useQuery(
    { deliverableId, customerId: customerId || "" },
    { enabled: !!deliverableId }
  );

  // 發送訊息 - 根據用戶類型決定 senderType
  const { mutate: sendMessageMutation, isPending: isSending } = api.message.sendDeliverableMessage.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("發送失敗:", error);
    },
  });

  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    // ✅ 根據當前用戶類型決定 senderType
    const senderType = currentUser.type === "sales" ? "sales" : "customer";
    const senderId = currentUser.id;

    sendMessageMutation({
      deliverableId,
      content,
      senderType,
      senderId,
      customerId: customerId || undefined,
    });
  };

  // 自動輪詢新訊息
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [refetch]);

  return {
    messages: messages || [],
    isLoading,
    isSending,
    sendMessage,
    currentUser,
  };
}