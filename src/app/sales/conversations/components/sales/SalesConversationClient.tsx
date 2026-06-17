"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Loader2, Send, Search, ChevronLeft, Phone, Mail, Building2, User as UserIcon, Clock, MessageSquare, Bell } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { trpc } from "../../../../../../trpc/client";

// ========== 型別定義 ==========

type CustomerItem = {
  id: string;
  name: string | null;
  companyname: string | null;
  contactname: string | null;
  contactphone: string | null;
  companyemail: string | null;
  totalQuotations: number;
  wonQuotations: number;
  totalProjects: number;
  activeProjects: number;
  lastConversationAt: Date | null;
  lastConversationPreview: string | null;
  unreadCount: number;
  currentSalesId: string | null;
  currentSalesName: string | null;
};

type ConversationMessage = {
  id: string;
  content: string;
  createdAt: Date;
  senderType: "SALES" | "CUSTOMER";
  salesId: string;
  customerId: string;
  isRead: boolean;
};

// ========== 主元件 ==========

export default function SalesConversationClient() {
  const router = useRouter();

  // ----- 狀態 -----
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  // Ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ----- 視窗尺寸監聽 -----
  useEffect(() => {
    const checkWidth = () => setIsMobileView(window.innerWidth < 768);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // ----- tRPC Queries -----

  // 1. 取得客戶列表（含未讀數、最後訊息）
  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    refetch: refetchCustomers,
  } = trpc.salesCustomer.getCustomersWithStats.useQuery(undefined, {
    refetchInterval: 5000, // 每 5 秒輪詢新訊息
  });

  // 2. 取得總未讀數
  const { data: unreadData, refetch: refetchUnread } =
    trpc.salesCustomer.getUnreadCount.useQuery(undefined, {
      refetchInterval: 5000,
    });

  // 3. 取得與選中客戶的對話記錄
  const {
    data: conversationsData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = trpc.salesCustomer.getConversations.useQuery(
    { customerId: selectedCustomerId!, limit: 50 },
    { enabled: !!selectedCustomerId }
  );

  // 4. 取得選中客戶的詳細資訊
  const { data: customerInfo } = trpc.salesCustomer.getCustomerInfo.useQuery(
    { customerId: selectedCustomerId! },
    { enabled: !!selectedCustomerId }
  );

  // ----- Mutations -----

  const { mutate: sendMessage, isPending: isSending } =
    trpc.salesCustomer.sendMessage.useMutation({
      onSuccess: () => {
        setMessageText("");
        refetchMessages();
        refetchCustomers();
        refetchUnread();
      },
      onError: (err) => {
        toast.error(err.message || "發送失敗");
      },
    });

  // ----- 自動滾到底部 -----
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversationsData, scrollToBottom]);

  // ----- 發送訊息 -----
  const handleSend = () => {
    if (!messageText.trim() || !selectedCustomerId || isSending) return;
    sendMessage({
      customerId: selectedCustomerId,
      content: messageText.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ----- 選擇客戶 -----
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setMessageText("");
    if (isMobileView) setShowListOnMobile(false);
    // 聚焦輸入框
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  // ----- 過濾客戶列表 -----
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.companyname?.toLowerCase().includes(q) ||
      c.contactname?.toLowerCase().includes(q) ||
      c.contactphone?.includes(q)
    );
  });

  // 排序：未讀優先 → 最近對話優先
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    // 未讀優先
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    // 再依最後對話時間排序
    const aTime = a.lastConversationAt?.getTime() || 0;
    const bTime = b.lastConversationAt?.getTime() || 0;
    return bTime - aTime;
  });

  // 選中的客戶資料
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // 對話記錄（已排序：由舊到新）
  const messages: ConversationMessage[] = conversationsData?.conversations || [];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* ===== Header ===== */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-gray-500" />
          <h1 className="text-lg font-bold text-gray-900">客戶對話管理</h1>
          {(unreadData?.count ?? 0) > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {unreadData?.count} 則未讀
            </span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          共 {customers.length} 位客戶
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ===== 左側：客戶列表 ===== */}
        <div
          className={`${
            isMobileView ? (showListOnMobile ? "w-full" : "hidden") : "w-80 lg:w-96"
          } bg-white border-r border-gray-200 flex flex-col shrink-0`}
        >
          {/* 搜尋框 */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋客戶名稱或公司..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 客戶列表 */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingCustomers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : sortedCustomers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {searchQuery ? "找不到符合的客戶" : "目前尚無客戶"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sortedCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-gray-50 ${
                      selectedCustomerId === customer.id
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : "border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 頭像 */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                          customer.unreadCount > 0
                            ? "bg-blue-500 ring-2 ring-blue-300"
                            : "bg-gray-400"
                        }`}
                      >
                        {(customer.companyname || customer.name || "?").charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-gray-900 truncate">
                            {customer.companyname || customer.name || "未命名客戶"}
                          </span>
                          {customer.lastConversationAt && (
                            <span className="text-xs text-gray-400 shrink-0">
                              {formatDistanceToNow(customer.lastConversationAt)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 truncate">
                            {customer.name && `@${customer.name}`}
                            {customer.contactname && ` (${customer.contactname})`}
                          </span>
                        </div>

                        {/* 最後訊息預覽 */}
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">
                            {customer.lastConversationPreview || "尚無對話記錄"}
                          </p>
                          {customer.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5">
                              {customer.unreadCount > 99 ? "99+" : customer.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== 右側：對話區 ===== */}
        <div
          className={`flex-1 flex flex-col bg-gray-50 ${
            isMobileView ? (showListOnMobile ? "hidden" : "w-full") : ""
          }`}
        >
          {selectedCustomerId && selectedCustomer ? (
            <>
              {/* 對話 Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
                {isMobileView && (
                  <button
                    onClick={() => setShowListOnMobile(true)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                  </button>
                )}
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {(selectedCustomer.companyname || selectedCustomer.name || "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {selectedCustomer.companyname || selectedCustomer.name || "未命名客戶"}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {selectedCustomer.contactname && (
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" /> {selectedCustomer.contactname}
                      </span>
                    )}
                    {selectedCustomer.contactphone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {selectedCustomer.contactphone}
                      </span>
                    )}
                  </div>
                </div>

                {/* 客戶統計標籤 */}
                <div className="flex items-center gap-2">
                  {selectedCustomer.activeProjects > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {selectedCustomer.activeProjects} 進行中
                    </span>
                  )}
                  {selectedCustomer.wonQuotations > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {selectedCustomer.wonQuotations} 成交
                    </span>
                  )}
                </div>
              </div>

              {/* 訊息列表 */}
              <div
                ref={messageListRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              >
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageSquare className="w-12 h-12 mb-2" />
                    <p className="text-sm">尚未有對話記錄</p>
                    <p className="text-xs mt-1">發送第一條訊息來開始對話</p>
                  </div>
                ) : (
                  <>
                    {/* 最早訊息的「開始對話」標記 */}
                    <div className="text-center">
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {(() => {
                          const firstMsg = messages[0];
                          return firstMsg
                            ? format(new Date(firstMsg.createdAt), "yyyy/MM/dd HH:mm", { locale: zhTW })
                            : "";
                        })()}
                      </span>
                    </div>

                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderType === "CUSTOMER" ? "justify-start" : "justify-end"}`}
                      >
                        <div className="flex items-end gap-2 max-w-[75%]">
                          {/* 客戶訊息左邊頭像 */}
                          {msg.senderType === "CUSTOMER" && (
                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(selectedCustomer.companyname || "客").charAt(0)}
                            </div>
                          )}

                          <div
                            className={`px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl ${
                              msg.senderType === "CUSTOMER"
                                ? "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                                : "bg-blue-600 text-white rounded-br-sm"
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                msg.senderType === "CUSTOMER"
                                  ? "text-gray-400"
                                  : "text-blue-200"
                              }`}
                            >
                              {format(new Date(msg.createdAt), "HH:mm")}
                            </p>
                          </div>

                          {/* Sales 訊息右邊頭像 */}
                          {msg.senderType === "SALES" && (
                            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              我
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* 輸入區 */}
              <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    placeholder="輸入訊息... (Enter 發送)"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isSending || !messageText.trim()}
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* 未選中客戶時的空白狀態 */
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-500 mb-1">選擇一位客戶開始對話</h3>
              <p className="text-sm">從左側列表選擇客戶，查看對話記錄並回覆</p>
              {customers.length > 0 && (
                <div className="mt-6 flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-700">{customers.length}</p>
                    <p className="text-gray-400">總客戶數</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{unreadData?.count || 0}</p>
                    <p className="text-gray-400">未讀訊息</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {customers.filter((c) => c.unreadCount > 0).length}
                    </p>
                    <p className="text-gray-400">待回覆</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== 輔助函數 ==========

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "剛剛";
  if (diffMin < 60) return `${diffMin}分鐘前`;
  if (diffHour < 24) return `${diffHour}小時前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return format(date, "MM/dd", { locale: zhTW });
}
