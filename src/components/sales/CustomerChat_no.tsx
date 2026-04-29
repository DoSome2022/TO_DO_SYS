"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building,
  Phone,
  Mail,
  FileText,
  FolderOpen,
  CheckCircle,
  Clock,
} from "lucide-react";

import CustomerChatList from "./CustomerChatList_no";
import { useCustomerInfo } from "../../../hooks/useSalesCustomer";

export default function CustomerChat() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;
  
  const { data: customerInfo, isLoading: infoLoading } = useCustomerInfo(customerId);

  if (infoLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">載入對話中...</div>
      </div>
    );
  }

  const displayName = customerInfo?.companyname || customerInfo?.name || "客戶";
  const wonQuotationsCount = customerInfo?.quotations?.filter((q: any) => q.status === "WON").length || 0;

  return (
    <div className="flex flex-col h-screen bg-muted/20">
      {/* 頂部導航 */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/sales/customers")}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回列表
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{displayName}</h1>
                  {customerInfo?.Project?.some((p: any) => p.status !== "COMPLETED") && (
                    <Badge variant="default" className="bg-green-500">
                      <Clock className="w-3 h-3 mr-1" />
                      進行中
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                  {customerInfo?.contactname && (
                    <span>聯絡人：{customerInfo.contactname}</span>
                  )}
                  {customerInfo?.contactphone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {customerInfo.contactphone}
                    </span>
                  )}
                  {customerInfo?.companyemail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {customerInfo.companyemail}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* 客戶統計 */}
            <div className="flex gap-4 text-sm">
              <div className="text-center min-w-[60px]">
                <div className="flex items-center justify-center gap-1 text-blue-600">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">
                    {customerInfo?.quotations?.length || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">報價單</p>
              </div>
              <div className="text-center min-w-[60px]">
                <div className="flex items-center justify-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">{wonQuotationsCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">成交</p>
              </div>
              <div className="text-center min-w-[60px]">
                <div className="flex items-center justify-center gap-1 text-purple-600">
                  <FolderOpen className="w-4 h-4" />
                  <span className="font-medium">
                    {customerInfo?.Project?.length || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">專案</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 對話區域 */}
      <div className="flex-1 overflow-hidden relative">
        <CustomerChatList customerId={customerId} customerName={displayName} />
      </div>
    </div>
  );
}