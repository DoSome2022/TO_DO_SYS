"use client";

import { useState } from "react";
import SalesChatList from "@/components/sales/SalesChatList";
import SalesChat from "@/components/sales/SalesChat";

export default function SalesProjectChatPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectTitle, setSelectedProjectTitle] = useState<string>("");

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* 左側列表 */}
      <SalesChatList
        selectedProjectId={selectedProjectId}
        onSelectProject={(id, title) => {
          setSelectedProjectId(id);
          setSelectedProjectTitle(title);
        }}
      />

      {/* 右側對話區 */}
      <SalesChat
        projectId={selectedProjectId}
        projectTitle={selectedProjectTitle}
      />
    </div>
  );
}
