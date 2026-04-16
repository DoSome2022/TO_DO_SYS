"use client"; // 標明這是 Client Component

import { api } from "@/utils/api";
import { useState } from "react";


// 接收從 Server 傳來的 initialData 或 id
interface ExternalChatClientProps {
  quotationId: string;
}

export default function ExternalChatClient({ quotationId }: ExternalChatClientProps) {
  const [message, setMessage] = useState("");
  const utils = api.useUtils();

  // Client 端的即時抓取 (輪詢)
  const { data: messages } = api.quotation.getExternalMessages.useQuery(
    { quotationId },
    { refetchInterval: 5000 }
  );

  const sendMessage = api.quotation.sendExternalMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.quotation.getExternalMessages.invalidate({ quotationId });
    },
  });

  return (
    <div className="flex h-[400px] flex-col border rounded-lg bg-white">
      {/* 訊息顯示區 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages?.map((msg) => (
          <div key={msg.id} className="text-sm">
            <span className="font-bold text-gray-600 mr-2">
              {msg.senderUser?.name || msg.senderCustomer?.name || "未知"}:
            </span>
            <span className="bg-blue-100 px-2 py-1 rounded">{msg.content}</span>
          </div>
        ))}
      </div>

      {/* 輸入區 */}
      <div className="flex border-t p-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 border rounded px-2"
          placeholder="輸入訊息..."
        />
        <button
          onClick={() => sendMessage.mutate({ quotationId, content: message })}
          className="ml-2 bg-blue-500 text-white px-4 rounded"
        >
          送出
        </button>
      </div>
    </div>
  );
}
