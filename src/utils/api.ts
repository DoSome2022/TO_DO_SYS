// src/utils/api.ts

import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";
import { type AppRouter } from "../../server"; 

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; 
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; 
  return `http://localhost:${process.env.PORT ?? 3000}`; 
};

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      /**
       * 設定連線連結
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          // 👇 位置 1: 用於網路傳輸 (解決之前的錯誤)
          transformer: superjson, 
        }),
      ],
    };
  },
  /**
   * SSR: false 代表預設不使用伺服器端渲染 tRPC 請求
   */
  ssr: false,
  
  // 👇 位置 2: 用於 Next.js 資料還原 (解決現在的錯誤)
  transformer: superjson, 
});

/**
 * 推斷類型的 Helper
 */
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
