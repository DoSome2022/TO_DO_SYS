// // components/sales/chat/ChatArea.tsx
// "use client";


// import { ScrollArea } from "@/components/ui/scroll-area";
// import { ChatMessage } from "./ChatMessage";
// import { ChatInput } from "./ChatInput";
// import { Loader2 } from "lucide-react";
// import { useVersionChat } from "../../../../hooks/useVersionChat";

// interface ChatAreaProps {
//   versionId: string;
//   versionName: string;
//   customerId?: string | null;
// }

// export function ChatArea({ versionId, versionName, customerId }: ChatAreaProps) {
//   const {
//     messages,
//     isLoading,
//     isSending,
//     sendMessage,
//     currentUser,
//   } = useVersionChat({ versionId, customerId });

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
//       </div>
//     );
//   }

//   return (
//     <div className="h-full flex flex-col bg-gray-50">
//       {/* 對話標題 */}
//       <div className="bg-white border-b px-6 py-4">
//         <h2 className="font-semibold">{versionName}</h2>
//         <p className="text-sm text-muted-foreground mt-1">
//           {currentUser?.type === "customer" ? "客戶視角" : "業務視角"}
//         </p>
//       </div>

//       {/* 訊息列表 */}
//       <ScrollArea className="flex-1 p-4">
//         <div className="space-y-4">
//           {messages.length === 0 ? (
//             <div className="text-center py-12">
//               <p className="text-muted-foreground">尚無對話記錄</p>
//               <p className="text-sm text-muted-foreground mt-2">
//                 發送第一則訊息開始討論
//               </p>
//             </div>
//           ) : (
//             messages.map((message) => (
//               <ChatMessage
//                 key={message.id}
//                 message={message}
//                 isCurrentUser={message.senderId === currentUser?.id}
//               />
//             ))
//           )}
//         </div>
//       </ScrollArea>

//       {/* 輸入區域 */}
//       <ChatInput
//         onSend={sendMessage}
//         isSending={isSending}
//         placeholder="輸入訊息... (按 Enter 發送，Shift+Enter 換行)"
//       />
//     </div>
//   );
// }

//有兩個版本 上 是有小工作版本

// components/sales/chat/ChatArea.tsx
"use client";


import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Loader2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDeliverableChat } from "../../../../hooks/useDeliverableChat";

interface ChatAreaProps {
  deliverableId: string;
  deliverableName: string;
  deliverableUrl: string;
  customerId?: string | null;
}

export function ChatArea({ deliverableId, deliverableName, deliverableUrl, customerId }: ChatAreaProps) {
  const {
    messages,
    isLoading,
    isSending,
    sendMessage,
    currentUser,
  } = useDeliverableChat({ deliverableId, customerId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  console.log(" Data : ", deliverableName, "-- End --");

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 對話標題 - 顯示成品資訊 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-lg">{deliverableName}</h2>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-sm"
                onClick={() => window.open(deliverableUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                開啟成品
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentUser?.type === "customer" ? "客戶視角" : "業務視角"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 訊息列表 */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">尚無對話記錄</p>
              <p className="text-sm text-muted-foreground mt-2">
                針對此成品提出您的意見或問題
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.senderId === currentUser?.id}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* 輸入區域 */}
      <ChatInput
        onSend={sendMessage}
        isSending={isSending}
        placeholder="輸入訊息... (按 Enter 發送，Shift+Enter 換行)"
      />
    </div>
  );
}