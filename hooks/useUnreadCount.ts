// src/features/sales-conversation/hooks/useUnreadCount.ts


import { api } from '@/utils/api';
import { useEffect } from 'react';

export function useUnreadCount(options?: { onNewMessage?: (count: number) => void }) {
  const { data, refetch } = api.salesCustomer.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // 每30秒自動刷新
  });

  useEffect(() => {
    if (data?.count && options?.onNewMessage) {
      options.onNewMessage(data.count);
    }
  }, [data?.count, options]);

  return {
    unreadCount: data?.count ?? 0,
    refetchUnreadCount: refetch,
  };
}