// Next.js 16 App Router - Server Component
import { Suspense } from "react";
import SalesConversationClient from "./components/sales/SalesConversationClient";


export const metadata = {
  title: "客戶對話管理 | 後台",
};

export default function SalesConversationsPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-500">載入中...</div>}>
        <SalesConversationClient />
      </Suspense>
    </div>
  );
}
