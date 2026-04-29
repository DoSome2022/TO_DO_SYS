// components/review/CustomerVersionReview.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VersionChatArea } from "./VersionChatArea";
import { MessageCircle, ExternalLink, CheckCircle, XCircle, FileText } from "lucide-react";
import { trpc } from "../../../trpc/client";

// ✅ 修改：加入 reviewStatus, reviewComment, note 屬性
interface Deliverable {
  id: string;
  name: string;
  url: string;
  fileKey: string | null;
  fileSize: number | null;
  createdAt: Date;
  reviewStatus?: string;      // ✅ 新增：審核狀態
  reviewComment?: string | null;  // ✅ 新增：審核意見
  note?: string | null;       // ✅ 新增：備註
}

interface Phase {
  id: string;
  name: string;
  description: string | null;
  status: string;
  deliverables: Deliverable[];
}

interface CustomerVersionReviewProps {
  projectId: string;
  projectTitle: string;
  customerId: string;
  phases: Phase[];
  onReviewComplete: () => void;
}

export default function CustomerVersionReview({
  projectId,
  projectTitle,
  customerId,
  phases,
  onReviewComplete,
}: CustomerVersionReviewProps) {
  const [selectedDeliverable, setSelectedDeliverable] = useState<{
    id: string;
    name: string;
    phaseName: string;
  } | null>(null);
  
  const { mutate: approveDeliverable, isPending: isApproving } = trpc.message.approveDeliverable.useMutation({
    onSuccess: () => {
      onReviewComplete();
    },
  });
  
  const { mutate: rejectDeliverable, isPending: isRejecting } = trpc.message.rejectDeliverable.useMutation({
    onSuccess: () => {
      onReviewComplete();
    },
  });
  
  const handleApprove = (deliverableId: string) => {
    approveDeliverable({ deliverableId, customerId, projectId });
  };
  
  const handleReject = (deliverableId: string, comment: string) => {
    rejectDeliverable({ deliverableId, customerId, projectId, comment });
  };
  
  const handleOpenChat = (deliverable: Deliverable, phaseName: string) => {
    setSelectedDeliverable({
      id: deliverable.id,
      name: deliverable.name,
      phaseName: phaseName,
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">✓ 客戶已確認</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">✗ 需修改</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ 待客戶確認</Badge>;
    }
  };
  
  // 如果選中了交付成品，顯示對話區
  if (selectedDeliverable) {
    return (
      <VersionChatArea
        deliverableId={selectedDeliverable.id}
        versionName={selectedDeliverable.name}
        projectTitle={projectTitle}
        phaseName={selectedDeliverable.phaseName}
        customerId={customerId}
        onClose={() => setSelectedDeliverable(null)}
      />
    );
  }
  
  // 過濾出有交付成品的階段
  const phasesWithDeliverables = phases.filter(phase => phase.deliverables && phase.deliverables.length > 0);
  
  if (phasesWithDeliverables.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">目前沒有任何交付成品</p>
        <p className="text-sm text-gray-400 mt-2">當 PM 上傳完成品後，您可以在這裡審核</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {phasesWithDeliverables.map((phase) => (
        <Card key={phase.id}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{phase.name}</span>
              {phase.status === "COMPLETED" && (
                <Badge className="bg-green-100 text-green-800">階段已完成</Badge>
              )}
            </CardTitle>
            {phase.description && (
              <p className="text-sm text-muted-foreground">{phase.description}</p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {phase.deliverables.map((deliverable) => (
              <div
                key={deliverable.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      {deliverable.name}
                      {getStatusBadge(deliverable.reviewStatus || "PENDING")}
                    </h4>
                    {deliverable.fileSize && (
                      <p className="text-xs text-muted-foreground mt-1">
                        大小：{(deliverable.fileSize / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {deliverable.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(deliverable.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        預覽
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600"
                      onClick={() => handleOpenChat(deliverable, phase.name)}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      對話與審核
                    </Button>
                  </div>
                </div>
                
                {deliverable.note && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {deliverable.note}
                  </p>
                )}
                
                {deliverable.reviewComment && deliverable.reviewStatus === "REJECTED" && (
                  <div className="text-sm bg-red-50 p-2 rounded text-red-700">
                    <span className="font-medium">修改意見：</span>
                    {deliverable.reviewComment}
                  </div>
                )}
                
                {/* 審核按鈕（只有待審核狀態才顯示） */}
                {(!deliverable.reviewStatus || deliverable.reviewStatus === "PENDING") && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(deliverable.id)}
                      disabled={isApproving || isRejecting}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      確認通過
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const comment = prompt("請說明需要修改的地方：");
                        if (comment) handleReject(deliverable.id, comment);
                      }}
                      disabled={isApproving || isRejecting}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      要求修改
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}