// src/trpc/server.ts
import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { createCaller } from "../server"; // 🔥 指向匯出 createCaller 的檔案 (src/server/index.ts)
import { createTRPCContext } from "../server/trpc"; // 指向你的 Context 定義

/**
 * 建立一個被 cache 包裹的 Context
 */
const createContext = cache(async () => {
  // 🔥 修正點：加上 await
  // 因為在 Next.js 新版，headers() 是非同步的
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

/**
 * 匯出 server api
 * 用法: const data = await api.equipment.getAll();
 */
export const api = createCaller(createContext);
