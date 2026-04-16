"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useUpdateQuotationStatus } from "../../../../hooks/useQuotation";  // ✅ 修正導入路徑

// 定義 Quotation 型別，注意 customerPrice 是 number | null
interface Quotation {
  id: string;
  title: string;
  status: string;
  customerPrice: number | null;
  createdAt: Date;
  customer: {
    id: string;
    name: string | null;
    companyname: string | null;
  };
  project: {
    id: string;
    title: string;
    status: string;
  } | null;
  _count: {
    internalMessages: number;
    externalMessages: number;
  };
}

interface SalesQuotationsListProps {
  quotations: Quotation[];
  onStatusChange: () => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "草稿", variant: "secondary" },
  NEGOTIATING: { label: "交涉中", variant: "default" },
  WON: { label: "已成交", variant: "outline" },
  LOST: { label: "已流失", variant: "destructive" },
};

export default function SalesQuotationsList({
  quotations,
  onStatusChange,
}: SalesQuotationsListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const updateStatusMutation = useUpdateQuotationStatus();

  const handleStatusUpdate = async (id: string, status: "WON" | "LOST") => {
    setUpdatingId(id);
    try {
      await updateStatusMutation.mutateAsync({ quotationId: id, status });
      toast.success(`報價單已標記為 ${status === "WON" ? "成交" : "流失"}`);
      onStatusChange();
    } catch (error) {
      toast.error("更新失敗");
    } finally {
      setUpdatingId(null);
    }
  };

  if (quotations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          暫無報價單，點擊右上角「新增報價單」開始
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>報價單名稱</TableHead>
            <TableHead>客戶</TableHead>
            <TableHead>報價金額</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead>建立時間</TableHead>
            <TableHead>對話</TableHead>
            <TableHead>關聯專案</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((quotation) => (
            <TableRow key={quotation.id}>
              <TableCell className="font-medium">{quotation.title}</TableCell>
              <TableCell>
                {quotation.customer.companyname || quotation.customer.name}
              </TableCell>
              <TableCell>
                ${quotation.customerPrice?.toLocaleString() || "-"}
              </TableCell>
              <TableCell>
                <Badge variant={statusConfig[quotation.status]?.variant}>
                  {statusConfig[quotation.status]?.label}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(quotation.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    內部 {quotation._count.internalMessages}
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    外部 {quotation._count.externalMessages}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {quotation.project ? (
                  <Link
                    href={`/projects/${quotation.project.id}`}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {quotation.project.title}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updatingId === quotation.id}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/quotations/${quotation.id}`}>
                        查看詳情
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/quotations/${quotation.id}/messages`}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        對話紀錄
                      </Link>
                    </DropdownMenuItem>
                    {quotation.status !== "WON" && quotation.status !== "LOST" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(quotation.id, "WON")}
                          className="text-green-600"
                        >
                          標記為成交
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(quotation.id, "LOST")}
                          className="text-red-600"
                        >
                          標記為流失
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}