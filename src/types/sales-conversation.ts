// src/features/sales-conversation/types/index.ts

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  senderType: 'SALES' | 'CUSTOMER';
  salesId: string;
  customerId: string;
  isRead: boolean;
}

export interface CustomerInfo {
  id: string;
  name: string | null;
  companyname: string | null;
  contactname: string | null;
  contactphone: string | null;
  companyemail: string | null;
  quotations: Array<{
    id: string;
    status: string;
    customerPrice: number | null;
    createdAt: Date;
  }>;
  Project: Array<{
    id: string;
    status: string;
    title: string;
    pm: { id: string; name: string | null } | null;
  }>;
}

export interface ConversationState {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  hasMore: boolean;
  nextCursor: string | undefined;
}