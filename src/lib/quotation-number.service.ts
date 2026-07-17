// lib/quotation-number.service.ts
// ✨ 全新的報價單編號自動生成服務

import { PrismaClient } from "@prisma/client";
import { db } from "@/app/lib/prisma";

/**
 * 生成報價單編號
 * 格式：INV YYYY-MM-DD-HH-XXX
 * 
 * 例如：INV 2026-07-17-14-001
 *       INV 2026-07-17-14-002  (同一天同一小時的第二張)
 * 
 * @param tx - Prisma Transaction Client（可選，用於 transaction 內呼叫）
 * @returns 完整的編號字串
 */
export async function generateQuotationNumber(
  tx?: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
): Promise<string> {
  const now = new Date();

  // 1️⃣ 拆解時間元件
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");

  // 2️⃣ 計算「這個小時內」已經有幾張報價單
  const startOfHour = new Date(
    year, now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0
  );
  const endOfHour = new Date(
    year, now.getMonth(), now.getDate(), now.getHours(), 59, 59, 999
  );

  // 支援 transaction 內呼叫（用 tx）或一般呼叫（用 db）
  const client = tx ?? db;

  const count = await client.quotation.count({
    where: {
      createdAt: {
        gte: startOfHour,
        lte: endOfHour,
      },
    },
  });

  // 3️⃣ 流水號：同小時內第 N+1 張，補零到 3 碼
  const sequence = String(count + 1).padStart(3, "0");

  // 4️⃣ 組合最終編號
  return `INV ${year}-${month}-${day}-${hour}-${sequence}`;
}
