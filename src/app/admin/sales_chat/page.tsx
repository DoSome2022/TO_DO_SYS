"use client";

import { useState } from "react";
import { api } from "@/utils/api";
import AdminSalesChatList from "@/components/admin/AdminSalesChatList";
import AdminSalesChat from "@/components/admin/AdminSalesChat";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import {
  Loader2, UserCircle, ChevronRight, MessageSquare
} from "lucide-react";

export default function AdminSalesChatPage() {
  const [selectedSalesId, setSelectedSalesId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectTitle, setSelectedProjectTitle] = useState("");

  // 查詢所有 Sales
  const { data: salesUsers, isLoading: loadingSales } =
    api.projectSalesChannel.getSalesUsers.useQuery();

  // 查詢該 Sales 的專案
  const { data: salesProjects, isLoading: loadingProjects } =
    api.projectSalesChannel.getProjectsBySales.useQuery(
      { salesId: selectedSalesId! },
      { enabled: !!selectedSalesId }
    );

  const handleSelectSales = (salesId: string) => {
    setSelectedSalesId(salesId);
    setSelectedProjectId(null);
    setSelectedProjectTitle("");
  };

  const handleSelectProject = (projectId: string, projectTitle: string) => {
    setSelectedProjectId(projectId);
    setSelectedProjectTitle(projectTitle);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ── 左欄：Sales 列表 ── */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Sales 人員</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            選擇要聯繫的業務
          </p>
        </div>
        <ScrollArea className="flex-1">
          {loadingSales ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="py-2">
              {salesUsers?.map((sales) => (
                <button
                  key={sales.id}
                  onClick={() => handleSelectSales(sales.id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left
                    transition-colors hover:bg-blue-50
                    ${selectedSalesId === sales.id 
                      ? "bg-blue-50 border-r-2 border-blue-500" 
                      : ""
                    }`}
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 
                    flex items-center justify-center shrink-0">
                    <UserCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sales.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {sales._count.salesProjects} 個專案
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── 中欄：專案列表 ── */}
      <div className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col shrink-0">
        {!selectedSalesId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <UserCircle className="h-10 w-10 mx-auto mb-2" />
              <p className="text-sm">請選擇一位 Sales</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <h3 className="text-sm font-semibold text-gray-900">
                負責專案
              </h3>
            </div>
            <ScrollArea className="flex-1">
              {loadingProjects ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="py-2">
                  {salesProjects?.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => 
                        handleSelectProject(project.id, project.title)
                      }
                      className={`w-full px-4 py-3 text-left transition-colors
                        hover:bg-blue-50/50
                        ${selectedProjectId === project.id
                          ? "bg-blue-50 border-l-2 border-blue-500"
                          : ""
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {project.title}
                        </p>
                        {project.unreadCount > 0 && (
                          <span className="ml-2 h-5 min-w-[20px] px-1.5 
                            bg-red-500 text-white text-[10px] font-bold
                            rounded-full flex items-center justify-center">
                            {project.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {project.lastMessage 
                          ? `${project.lastMessage.sender.name}: ${project.lastMessage.content.substring(0, 30)}...`
                          : "尚無對話記錄"
                        }
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </div>

      {/* ── 右欄：對話框 ── */}
      <div className="flex-1">
        <AdminSalesChat
          projectId={selectedProjectId}
          projectTitle={selectedProjectTitle}
        />
      </div>
    </div>
  );
}
