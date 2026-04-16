// src/trpc/provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useState } from 'react';
import { trpc } from './client';
import superjson from "superjson"; 

export default function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
     defaultOptions: {
        queries: {
           refetchOnWindowFocus: false, 
        }
     }
  }));
  
  const [trpcClient] = useState(() =>
    trpc.createClient({
      // ❌ 錯誤位置：舊版寫法，這裡要刪掉
      // transformer: superjson, 

      links: [
        httpBatchLink({
          // ✅ 正確位置：新版 tRPC 要把 transformer 放在這裡面！
          transformer: superjson, 
          
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

// ... getBaseUrl 保持不變 ...
function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.TRPC_URL) return process.env.TRPC_URL;
  return `http://localhost:${process.env.PORT ?? 3000}`; 
}
