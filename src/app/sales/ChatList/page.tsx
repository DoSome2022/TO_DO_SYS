// app/sales/ChatList/page.tsx
// 移除 "use client" - 這是 Server Component
import { Suspense } from "react";
import { ChatListClient } from "./ChatListClient";


// Server Component - 處理 params 和 searchParams
interface PageProps {
  searchParams: Promise<{ projectId?: string; customerId?: string }>;
}

export default async function ChatListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const projectId = params.projectId || "";
  const customerId = params.customerId || "";

console.log(" params : ", { projectId, customerId }, "-- End --");


  return (
    <Suspense fallback={<ChatListSkeleton />}>
      <ChatListClient 
        projectId={projectId} 
        customerId={customerId} 
      />
    </Suspense>
  );
}

// 骨架屏
function ChatListSkeleton() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}