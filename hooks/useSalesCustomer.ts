"use client";

import { trpc } from "../trpc/client";



// ✅ 導出 Conversation 型別
export type Conversation = {
  id: string;
  content: string;
  createdAt: Date;
  senderType: string; // 👈 必須加上這一行！用來判斷是誰發的
  salesId?: string;
  customerId?: string;
  isRead?: boolean;
};

// ✅ 導出 CustomerWithStats 型別
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
// Query Hooks
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
      // refetchInterval: 3000, 
    }
  );
}

export function useCustomerInfo(customerId: string) {
  return trpc.salesCustomer.getCustomerInfo.useQuery(
    { customerId },
    { enabled: !!customerId }
  );
}

export function useUnreadCount() {
  return trpc.salesCustomer.getUnreadCount.useQuery();
}

// ==========================================
// Mutation Hooks
// ==========================================

export function useSendMessage() {
  const utils = trpc.useUtils();
  
  return trpc.salesCustomer.sendMessage.useMutation({
    onSuccess: (_, variables) => {
      utils.salesCustomer.getConversations.invalidate({
        customerId: variables.customerId,
      });
      utils.salesCustomer.getCustomersWithStats.invalidate();
      utils.salesCustomer.getUnreadCount.invalidate();
    },
  });
}