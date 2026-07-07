// src/app/sales/purchases/page.tsx
import { auth } from "@/auth";
import { headers } from "next/headers";
import SalesPurchasesList from "@/components/dashboard/SalesDashboard/SalesPurchasesList";
import { createCaller } from "../../../../server";
import { db } from "@/app/lib/prisma";

export default async function SalesPurchasesSection() {
  const session = await auth();

  const caller = createCaller({
    db,
    session,
    user: session?.user ?? null,
    headers: await headers(),
  } as any);

  const result = await caller.purchase.list({ pageSize: 20 });

  // 🆕 序列化資料：把 Decimal 轉成 number
  const serializedData = JSON.parse(JSON.stringify(result.data));

  return (
    <SalesPurchasesList 
      initialPurchases={serializedData}    // ← ✅ 改這裡
      initialTotal={result.total}
    />
  );
}
