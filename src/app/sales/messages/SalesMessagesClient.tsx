// app/sales/messages/SalesMessagesClient.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { 
  ArrowLeft, 
  Building, 
  Phone, 
  Mail, 
  Send,
  MessageCircle,
  FileText
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { trpc } from "../../../../trpc/client";

// 類型定義
type ProjectData = {
  id: string;
  title: string;
  status: string;
  quotation: {
    id: string;
    customerPrice: number | null;
    status: string;
  } | null;
};

type GeneralMessage = {
  id: string;
  content: string;
  isCustomer: boolean;
  createdAt: Date;
};

type ProjectMessage = {
  id: string;
  content: string;
  isCustomer: boolean;
  quotationId: string;
  createdAt: Date;
};

type Props = {
  salesId: string;
  customerId: string;
  customerName: string;
  projects: ProjectData[];
  generalMessages: GeneralMessage[];
  projectMessages: ProjectMessage[];
};

export default function SalesMessagesClient({
  salesId,
  customerId,
  customerName,
  projects,
  generalMessages,
  projectMessages,
}: Props) {
  const router = useRouter();
  const [activeQuotationChatId, setActiveQuotationChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 獲取當前顯示的訊息
  const currentMessages = activeQuotationChatId === null
    ? generalMessages
    : projectMessages.filter(m => m.quotationId === activeQuotationChatId);

  // 發送一般客服訊息
  const { mutate: sendGeneral, isPending: isSendingGeneral } = trpc.message.sendGeneralMessageAsSales.useMutation({
    onSuccess: () => {
      setMessageText("");
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error("發送失敗，請稍後再試。");
    },
  });

  // 發送專案報價單訊息
  const { mutate: sendProject, isPending: isSendingProject } = trpc.message.sendProjectMessageAsSales.useMutation({
    onSuccess: () => {
      setMessageText("");
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error("發送失敗，請稍後再試。");
    },
  });

  const isSending = isSendingGeneral || isSendingProject;

  const handleSendMessage = () => {
    if (!messageText.trim() || isSending) return;

    if (activeQuotationChatId === null) {
      sendGeneral({
        content: messageText,
        customerId: customerId,
        salesId: salesId,
      });
    } else {
      sendProject({
        content: messageText,
        quotationId: activeQuotationChatId,
        salesId: salesId,
        customerId: customerId,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // 自動輪詢新訊息
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);

  // 獲取當前對話標題
  const getCurrentChatTitle = () => {
    if (activeQuotationChatId === null) {
      return "💬 一般客服諮詢";
    }
    const project = projects.find(p => p.quotation?.id === activeQuotationChatId);
    return `📁 專案：${project?.title || "未知專案"}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 頂部導航欄 */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/sales/customers"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{customerName}</h1>
            <p className="text-sm text-gray-500">與客戶對話中</p>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Sales ID: {salesId.slice(0, 8)}...
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左側 - 對話列表 */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-700">對話列表</h2>
            <p className="text-xs text-gray-400 mt-1">點擊切換對話</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* 一般客服 */}
            <button
              onClick={() => setActiveQuotationChatId(null)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                activeQuotationChatId === null
                  ? "bg-blue-100 text-blue-800 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>💬 一般客服諮詢</span>
              </div>
            </button>

            {/* 專案報價單對話 */}
            {projects.filter(p => p.quotation).length > 0 && (
              <>
                <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  專案報價單對話
                </div>
                {projects.filter(p => p.quotation).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setActiveQuotationChatId(project.quotation!.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                      activeQuotationChatId === project.quotation!.id
                        ? "bg-blue-100 text-blue-800 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="truncate">{project.title}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      狀態: {project.quotation?.status || "進行中"}
                    </p>
                  </button>
                ))}
              </>
            )}

            {projects.filter(p => p.quotation).length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                暫無專案報價單對話
              </div>
            )}
          </div>
        </div>

        {/* 右側 - 對話區域 */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* 對話標題 */}
          <div className="bg-white border-b px-6 py-4 shadow-sm">
            <h2 className="font-semibold text-gray-800">
              {getCurrentChatTitle()}
            </h2>
          </div>

          {/* 訊息列表 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {currentMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400">尚無對話記錄</p>
                  <p className="text-sm text-gray-400 mt-2">
                    發送訊息開始與客戶溝通
                  </p>
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isCustomer ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.isCustomer
                          ? "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                          : "bg-blue-600 text-white rounded-br-sm"
                      }`}
                    >
                      {/* 發送者標籤 */}
                      <p className="text-xs mb-1 opacity-70">
                        {msg.isCustomer ? "客戶" : "我 (業務)"}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70 text-right">
                        {format(new Date(msg.createdAt), "HH:mm", { locale: zhTW })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 輸入區域 */}
          <div className="bg-white border-t p-4">
            <div className="flex gap-3">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="輸入訊息... (Enter 發送，Shift+Enter 換行)"
                className="flex-1 px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
                disabled={isSending}
              />
              <button
                onClick={handleSendMessage}
                disabled={isSending || !messageText.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              訊息會即時送達客戶端
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}