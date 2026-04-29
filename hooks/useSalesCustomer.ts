// src/hooks/useSalesCustomer.ts

"use client";

import { trpc } from "../trpc/client";

export type Conversation = {
  id: string;
  content: string;
  createdAt: Date;
  senderType: string;
  salesId?: string;
  customerId?: string;
  isRead?: boolean;
};

export type CustomerWithStats = {
  id: string;
  name: string | null;
  companyname: string | null;
  contactname: string | null;
  contactphone: string | null;
  companyemail: string | null;
  totalQuotations: number;
  wonQuotations: number;
  totalProjects: number;
  activeProjects: number;
  lastConversationAt: Date | null;
  lastConversationPreview: string | null;
  unreadCount: number;
  currentSalesId: string | null;
  currentSalesName: string | null;
};

// ==========================================
// Query Hooks (支援 initialData)
// ==========================================

export function useCustomersWithStats() {
  return trpc.salesCustomer.getCustomersWithStats.useQuery();
}

export function useConversations(customerId: string, limit: number = 50) {
  return trpc.salesCustomer.getConversations.useInfiniteQuery(
    { customerId, limit },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!customerId,
      // 輪詢間隔：5秒檢查新訊息
      refetchInterval: 5000,
      // 視窗聚焦時重新獲取
      refetchOnWindowFocus: true,
    }
  );
}

// ✅ 更新：支援 initialData
export function useCustomerInfo(customerId: string, options?: { initialData?: any }) {
  return trpc.salesCustomer.getCustomerInfo.useQuery(
    { customerId },
    { 
      enabled: !!customerId,
      initialData: options?.initialData,
      // 5分鐘內不重新請求
      staleTime: 5 * 60 * 1000,
    }
  );
}

export function useUnreadCount() {
  return trpc.salesCustomer.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // 30秒檢查一次未讀
  });
}

// ==========================================
// Mutation Hooks
// ==========================================

export function useSendMessage() {
  const utils = trpc.useUtils();
  
  return trpc.salesCustomer.sendMessage.useMutation({
    onSuccess: (newMessage, variables) => {
      // 更新對話列表快取
      utils.salesCustomer.getConversations.setInfiniteData(
        { customerId: variables.customerId, limit: 50 },
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page, index) => {
              if (index === 0) {
                return {
                  ...page,
                  conversations: [newMessage, ...page.conversations],
                };
              }
              return page;
            }),
          };
        }
      );
      
      // 使相關查詢失效
      utils.salesCustomer.getConversations.invalidate({
        customerId: variables.customerId,
      });
      utils.salesCustomer.getCustomersWithStats.invalidate();
      utils.salesCustomer.getUnreadCount.invalidate();
    },
  });
}