// src/components/CustomerProfileClient.tsx

"use client";

import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation";
import { toast } from "sonner"; 
import { trpc } from "../../../../../trpc/client";
import CustomerVersionReview from "@/components/review/CustomerVersionReview";

// ✅ 直接在本地定義類型，確保與實際資料結構一致
interface Deliverable {
  id: string;
  name: string;
  url: string;
  fileKey: string | null;
  fileSize: number | null;
  createdAt: Date;
  reviewStatus?: string;
  reviewComment?: string | null;
  note?: string | null;
}

interface Phase {
  id: string;
  name: string;
  description: string | null;
  status: string;
  deliverables: Deliverable[];
}

// Type 定義
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
  customerId: string; 
  userName: string;
  projects: ProjectData[];
  generalMessages: GeneralMessage[];
  projectMessages: ProjectMessage[];
};

export default function CustomerProfileClient({ 
  customerId, 
  userName, 
  projects, 
  generalMessages, 
  projectMessages 
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"projects" | "chat" | "review">("projects");
  const [selectedReviewProjectId, setSelectedReviewProjectId] = useState<string | null>(null);
  const [activeQuotationChatId, setActiveQuotationChatId] = useState<string | null>(null); 
  const [messageText, setMessageText] = useState("");

  // 獲取專案的階段版本資料 (只在 review tab 且選中專案時才查詢)
  const { data: projectPhasesData, refetch: refetchPhases } = trpc.review.getCustomerProjectVersions.useQuery(
    { 
      projectId: selectedReviewProjectId!, 
      customerId: customerId 
    },
    {
      enabled: !!selectedReviewProjectId && activeTab === "review",
      staleTime: 0,
    }
  );

  // 自動輪詢邏輯
  useEffect(() => {
    if (activeTab !== "chat") return;

    const intervalId = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [activeTab, router]);

  // tRPC Mutations (發送訊息)
  const { mutate: sendGeneral, isPending: isSendingGeneral } = trpc.message.sendGeneralMessage.useMutation({
    onSuccess: () => {
      setMessageText(""); 
      router.refresh();   
    },
    onError: (error) => {
      console.error(error);
      toast.error("發送失敗，請稍後再試。");
    }
  });

  const { mutate: sendProject, isPending: isSendingProject } = trpc.message.sendProjectMessage.useMutation({
    onSuccess: () => {
      setMessageText(""); 
      router.refresh();   
    },
    onError: (error) => {
      console.error(error);
      toast.error("發送失敗，請稍後再試。");
    }
  });

  const isSending = isSendingGeneral || isSendingProject;

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    if (activeQuotationChatId === null) {
      sendGeneral({
        content: messageText,
        customerId: customerId,
      });
    } else {
      sendProject({
        content: messageText,
        quotationId: activeQuotationChatId,
        customerId: customerId,
      });
    }
  };

  const currentMessages = activeQuotationChatId === null 
    ? generalMessages 
    : projectMessages.filter(m => m.quotationId === activeQuotationChatId);

  const handleReviewComplete = () => {
    refetchPhases();
    toast.success("審核完成，感謝您的回饋！");
  };

  const normalizedPhases: Phase[] = (projectPhasesData?.phases || []).map((phase: any) => ({
    id: phase.id,
    name: phase.name,
    description: phase.description,
    status: phase.status,
    deliverables: (phase.deliverables || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      url: d.url,
      fileKey: d.fileKey ?? null,
      fileSize: d.fileSize ?? null,
      createdAt: new Date(d.createdAt),
      reviewStatus: d.reviewStatus || "PENDING",
      reviewComment: d.reviewComment ?? null,
      note: d.note ?? null,
    })),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* 歡迎區塊 */}
      <div className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          歡迎回來，{userName}
        </h1>
        <p className="text-gray-500 mt-2">您可以在此查看您的專案進度、報價單，並與專屬業務聯繫。</p>
      </div>

      {/* 頁籤切換 */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => {
            setActiveTab("projects");
            setSelectedReviewProjectId(null);
          }}
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "projects" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          我的專案與報價
        </button>
        <button
          onClick={() => {
            setActiveTab("chat");
            setSelectedReviewProjectId(null);
          }}
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "chat" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          訊息中心 (聯絡專員)
        </button>
        <button
          onClick={() => {
            setActiveTab("review");
            setSelectedReviewProjectId(null);
          }}
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "review" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📋 版本審核
          {projects.some(p => p.quotation) && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {projects.filter(p => p.quotation).length}
            </span>
          )}
        </button>
      </div>

      {/* 內容區：專案與報價單 */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.length === 0 && <p className="text-gray-500">目前尚無專案資料。</p>}
          {projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{project.title}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800`}>
                  {project.status}
                </span>
              </div>
              
              {project.quotation ? (
                <div className="text-gray-600 mb-4 space-y-2">
                  <p>報價單狀態：<span className="font-medium text-gray-900">{project.quotation.status}</span></p>
                  <p>報價金額：<span className="font-medium text-gray-900">
                    $ {Number(project.quotation.customerPrice || 0).toLocaleString()}
                  </span></p>
                </div>
              ) : (
                <div className="text-gray-400 mb-4">尚無對應報價單</div>
              )}

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => {
                    if (project.quotation) {
                      router.push(`/customer/profile/projects/${project.id}/quotation/${project.quotation.id}`);
                    }
                  }}
                  className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-lg border hover:bg-gray-100 transition"
                >
                  查看詳細報價單
                </button>
                {project.quotation && (
                  <>
                    <button 
                      onClick={() => { 
                        setActiveTab("chat"); 
                        setActiveQuotationChatId(project.quotation!.id); 
                      }}
                      className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition"
                    >
                      討論此專案
                    </button>
                    <button 
                      onClick={() => { 
                        setActiveTab("review"); 
                        setSelectedReviewProjectId(project.id); 
                      }}
                      className="flex-1 bg-purple-50 text-purple-700 py-2 rounded-lg border border-purple-100 hover:bg-purple-100 transition"
                    >
                      審核版本
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 內容區：訊息中心 - 只保留一般客服和專案報價單對話 */}
      {activeTab === "chat" && (
        <div className="flex flex-col md:flex-row bg-white border border-gray-200 rounded-xl overflow-hidden h-[600px] shadow-sm">
          {/* 左側列表 */}
          <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-4 font-bold text-gray-700 border-b bg-gray-100">對話列表</div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {/* 一般客服 */}
              <button
                onClick={() => setActiveQuotationChatId(null)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                  activeQuotationChatId === null ? "bg-blue-100 text-blue-800 font-medium" : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                💬 一般客服諮詢
              </button>
              
              {/* 專案專屬對話標題 */}
              <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                專案報價單對話
              </div>
              
              {projects.filter(p => p.quotation).map((project) => (
                <button
                  key={project.id}
                  onClick={() => setActiveQuotationChatId(project.quotation!.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                    activeQuotationChatId === project.quotation!.id ? "bg-blue-100 text-blue-800 font-medium" : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  📁 {project.title}
                </button>
              ))}
            </div>
          </div>

          {/* 右側對話框 */}
          <div className="w-full md:w-2/3 flex flex-col bg-white">
            <div className="p-4 border-b font-bold text-gray-800 shadow-sm flex items-center justify-between">
              {activeQuotationChatId === null 
                ? "💬 一般客服諮詢" 
                : `📁 專案：${projects.find(p => p.quotation?.id === activeQuotationChatId)?.title}`}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col-reverse">
              <div className="space-y-4 flex flex-col">
                {currentMessages.length > 0 ? (
                  currentMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isCustomer ? "justify-end" : "justify-start"}`}>
                      <div className={`px-4 py-2 max-w-[75%] rounded-2xl ${
                        msg.isCustomer 
                          ? "bg-blue-600 text-white rounded-br-sm" 
                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 mt-10">目前沒有訊息，打個招呼吧！</div>
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-white flex gap-2">
              <input 
                type="text" 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSending) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSending}
                placeholder="輸入您的訊息..." 
                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button 
                onClick={handleSendMessage}
                disabled={isSending || !messageText.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
              >
                {isSending ? "發送中..." : "發送"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 內容區：版本審核 */}
      {activeTab === "review" && (
        <div className="space-y-6">
          {!selectedReviewProjectId ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">選擇要審核的專案</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.filter(p => p.quotation).length === 0 ? (
                  <div className="col-span-2 text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">目前沒有任何需要審核的專案</p>
                    <p className="text-sm text-gray-400 mt-2">當您的專案有新的版本交付時，會在這裡顯示</p>
                  </div>
                ) : (
                  projects.filter(p => p.quotation).map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedReviewProjectId(project.id)}
                      className="p-6 bg-white border border-gray-200 rounded-xl text-left hover:border-purple-300 hover:shadow-md transition group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-700 transition">
                          {project.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === "COMPLETED" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {project.status === "COMPLETED" ? "已完成" : "進行中"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        報價單狀態：{project.quotation?.status}
                      </p>
                      <p className="text-sm text-purple-600 mt-3 group-hover:underline">
                        點擊審核交付版本 →
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    setSelectedReviewProjectId(null);
                    refetchPhases();
                  }}
                  className="text-purple-600 hover:text-purple-700 flex items-center gap-2 font-medium"
                >
                  ← 返回專案列表
                </button>
                <div className="text-sm text-gray-500">
                  專案 ID: {selectedReviewProjectId}
                </div>
              </div>

              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {projects.find(p => p.id === selectedReviewProjectId)?.title}
                </h2>
                <p className="text-gray-500 mt-1">請審核以下各階段的交付版本</p>
              </div>

              {!projectPhasesData && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="text-gray-500 mt-2">載入中...</p>
                </div>
              )}

              {projectPhasesData && (
                <CustomerVersionReview
                  projectId={selectedReviewProjectId}
                  projectTitle={projects.find(p => p.id === selectedReviewProjectId)?.title || ""}
                  customerId={customerId}
                  phases={normalizedPhases}
                  onReviewComplete={handleReviewComplete}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}