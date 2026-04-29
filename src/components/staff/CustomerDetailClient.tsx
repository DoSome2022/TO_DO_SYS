// src/components/staff/CustomerDetailClient.tsx (修改版)
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../trpc/client";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  User, 
  FileText, 
  MessageCircle,
  ChevronRight,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle
} from "lucide-react";

// ✨ 引入分離後的兩個子元件
import CustomerInfoView from "./CustomerInfoView";
import CustomerInfoEdit from "./CustomerInfoEdit";

type CustomerDetailClientProps = {
  customerId: string;
  staffId: string;
};

export default function CustomerDetailClient({ 
  customerId, 
  staffId 
}: CustomerDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "projects" | "quotations" | "messages">("info");
  // ✨ 新增編輯模式狀態
  const [isEditing, setIsEditing] = useState(false);

  // 獲取客戶詳細資料
  const { data: customer, isLoading, refetch } = trpc.staff.getCustomerDetail.useQuery({
    customerId,
    staffId,
  });

  // 獲取客戶的專案列表
  const { data: projects } = trpc.staff.getCustomerProjects.useQuery({
    customerId,
    staffId,
  }, {
    enabled: activeTab === "projects",
  });

  // 獲取客戶的報價單列表
  const { data: quotations } = trpc.staff.getCustomerQuotations.useQuery({
    customerId,
    staffId,
  }, {
    enabled: activeTab === "quotations",
  });

  const handleBack = () => {
    router.back();
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleViewQuotation = (quotationId: string, projectId?: string) => {
    if (projectId) {
      router.push(`/projects/${projectId}/quotation/${quotationId}`);
    } else {
      router.push(`/quotations/${quotationId}`);
    }
  };

  const handleSendMessage = () => {
    router.push(`/sales/messages?customerId=${customerId}`);
  };

  // ✨ 編輯成功回調：重新獲取資料 + 切回檢視模式
  const handleEditSuccess = useCallback(() => {
    setIsEditing(false);
    refetch(); // 重新載入最新資料
  }, [refetch]);

  // ✨ 切換到編輯模式前先確認
  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  // ✨ 取消編輯
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  // 切換頁籤時自動退出編輯模式
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab !== "info") {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">載入客戶資料中...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500">找不到客戶資料</p>
        <button
          onClick={handleBack}
          className="mt-4 text-blue-600 hover:underline"
        >
          返回列表
        </button>
      </div>
    );
  }

  const statusConfig = {
    active: { label: "活躍", className: "bg-green-100 text-green-800" },
    inactive: { label: "非活躍", className: "bg-gray-100 text-gray-800" },
    pending: { label: "待確認", className: "bg-yellow-100 text-yellow-800" },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 頂部導航 */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          返回客戶列表
        </button>
      </div>

      {/* 客戶基本資訊卡片 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {customer.name || customer.customname || "未命名客戶"}
              </h1>
              <div className="flex items-center gap-4 text-sm text-blue-100">
                <span>客戶編號：{customer.id.slice(0, 8).toUpperCase()}</span>
                <span>|</span>
                <span>加入日期：{new Date(customer.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.active.className}`}>
              {statusConfig.active.label}
            </span>
          </div>
        </div>

        {/* 聯絡資訊 */}
        <div className="px-6 py-4 border-b">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">聯絡資訊</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">電子郵件</p>
                  <p className="text-sm text-gray-900">{customer.email}</p>
                </div>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">聯絡電話</p>
                  <p className="text-sm text-gray-900">{customer.phone}</p>
                </div>
              </div>
            )}
            {customer.companyname && (
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">公司名稱</p>
                  <p className="text-sm text-gray-900">{customer.companyname}</p>
                </div>
              </div>
            )}
            {customer.contactname && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">聯絡人</p>
                  <p className="text-sm text-gray-900">{customer.contactname}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 公司地址 */}
        {customer.companyaddress && (
          <div className="px-6 py-4 border-b">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">公司地址</h3>
            <p className="text-sm text-gray-900">{customer.companyaddress}</p>
          </div>
        )}
      </div>

      {/* 頁籤切換 */}
      <div className="flex space-x-2 mb-6 border-b">
        <button
          onClick={() => handleTabChange("info")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "info"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          基本資料
        </button>
        <button
          onClick={() => handleTabChange("projects")}
          className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === "projects"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          專案列表
          {projects && projects.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
              {projects.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange("quotations")}
          className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === "quotations"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          報價單
          {quotations && quotations.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
              {quotations.length}
            </span>
          )}
        </button>
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 text-gray-500 hover:text-gray-700"
        >
          <MessageCircle className="w-4 h-4" />
          發送訊息
        </button>
      </div>

      {/* 內容區域 — ✨ 這裡是分離法的核心切換 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 基本資料頁籤：根據 isEditing 切換檢視/編輯 */}
        {activeTab === "info" && (
          isEditing ? (
            <CustomerInfoEdit
              customer={customer}
              onCancel={handleCancelEdit}
              onSuccess={handleEditSuccess}
            />
          ) : (
            <CustomerInfoView
              customer={customer}
              onEdit={handleStartEdit}
            />
          )
        )}

        {/* 專案列表頁籤（保持不變） */}
        {activeTab === "projects" && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">專案列表</h3>
            {!projects ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-2">載入中...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">暫無專案</p>
                <p className="text-sm text-gray-400 mt-1">該客戶目前沒有任何專案</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => handleViewProject(project.id)}
                  >
                    {/* ... 保持你原有的 project card 內容 ... */}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{project.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === "COMPLETED" 
                          ? "bg-green-100 text-green-800"
                          : project.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {project.status === "COMPLETED" ? "已完成" : 
                         project.status === "IN_PROGRESS" ? "進行中" : "規劃中"}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {project.startDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          開始：{new Date(project.startDate).toLocaleDateString()}
                        </div>
                      )}
                      {project.endDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          截止：{new Date(project.endDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <span className="text-blue-600 text-sm flex items-center gap-1">
                        查看詳情 <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 報價單列表頁籤（保持不變） */}
        {activeTab === "quotations" && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">報價單列表</h3>
            {!quotations ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-2">載入中...</p>
              </div>
            ) : quotations.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">暫無報價單</p>
                <p className="text-sm text-gray-400 mt-1">該客戶目前沒有任何報價單</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quotations.map((quotation) => (
                  <div
                    key={quotation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => handleViewQuotation(quotation.id, quotation.projectId || undefined)}
                  >
                    {/* ... 保持你原有的 quotation card 內容 ... */}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{quotation.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        quotation.status === "WON"
                          ? "bg-green-100 text-green-800"
                          : quotation.status === "NEGOTIATING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {quotation.status === "WON" ? "已成交" :
                         quotation.status === "NEGOTIATING" ? "交涉中" : "草稿"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div>
                        <p className="text-sm text-gray-500">報價金額</p>
                        <p className="text-lg font-bold text-blue-600">
                          $ {quotation.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {new Date(quotation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <span className="text-blue-600 text-sm flex items-center gap-1">
                        查看報價單 <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
