// src/features/sales-conversation/hooks/useConversation.ts

import { ConversationState, Message } from '@/types/sales-conversation';
import { api } from '@/utils/api';
import { useState, useEffect, useCallback, useRef } from 'react';

export function useConversation(customerId: string) {
  const [state, setState] = useState<ConversationState>({
    messages: [],
    isLoading: true,
    isSending: false,
    hasMore: false,
    nextCursor: undefined,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 查詢對話記錄 (使用無限滾動)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading: isLoadingMessages,
    refetch,
  } = api.salesCustomer.getConversations.useInfiniteQuery(
    {
      customerId,
      limit: 30,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!customerId,
    }
  );

  // 發送訊息 mutation
  const sendMessageMutation = api.salesCustomer.sendMessage.useMutation();

  // 標記已讀 mutation
  // const markAsRead = api.salesCustomer.getConversations.useMutation({
  //   onSuccess: () => {
  //     refetch();
  //   },
  // });

  // 處理訊息數據
  useEffect(() => {
    if (data) {
      const allMessages = data.pages.flatMap((page) => page.conversations);
      setState((prev) => ({
        ...prev,
        messages: allMessages,
        isLoading: isLoadingMessages,
        hasMore: hasNextPage || false,
        nextCursor: data.pages[data.pages.length - 1]?.nextCursor,
      }));
    }
  }, [data, isLoadingMessages, hasNextPage]);

  // 發送訊息
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setState((prev) => ({ ...prev, isSending: true }));

      // 樂觀更新：立即顯示訊息
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: content.trim(),
        createdAt: new Date(),
        senderType: 'SALES',
        salesId: '', // 會在後端填充
        customerId,
        isRead: false,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, optimisticMessage],
      }));

      // 滾動到底部
      setTimeout(() => scrollToBottom(), 100);

      try {
        const result = await sendMessageMutation.mutateAsync({
          customerId,
          content: content.trim(),
        });

        // 替換樂觀更新的訊息為真實數據
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === optimisticMessage.id ? result : msg
          ),
        }));
      } catch (error) {
        console.error('發送訊息失敗:', error);
        // 移除失敗的樂觀訊息
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((msg) => msg.id !== optimisticMessage.id),
        }));
        throw error;
      } finally {
        setState((prev) => ({ ...prev, isSending: false }));
      }
    },
    [customerId, sendMessageMutation]
  );

  // 滾動到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 加載更多歷史訊息
  const loadMore = useCallback(() => {
    if (hasNextPage && !state.isLoading) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, state.isLoading]);

  // 當有新訊息時滾動到底部
  useEffect(() => {
    if (state.messages.length > 0) {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage.senderType === 'SALES') {
        scrollToBottom();
      }
    }
  }, [state.messages, scrollToBottom]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isSending: state.isSending,
    hasMore: state.hasMore,
    sendMessage,
    loadMore,
    scrollToBottom,
    messagesEndRef,
    scrollContainerRef,
    refetch,
  };
}