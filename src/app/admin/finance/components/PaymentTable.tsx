// src/features/admin/finance/components/PaymentTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import type { PaymentSearchResult } from "../types";
import { format } from "date-fns";

interface PaymentTableProps {
  data?: PaymentSearchResult;
  isLoading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPaymentClick?: (paymentId: string) => void;
}

// 付款方式對應中文
const paymentMethodLabels: Record<string, string> = {
  CASH: "現金",
  TRANSFER: "轉帳",
  CHECK: "支票",
  CREDIT_CARD: "信用卡",
  LINE_PAY: "LINE Pay",
  OTHER: "其他",
};

export function PaymentTable({
  data,
  isLoading,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onPaymentClick,
}: PaymentTableProps) {
  // 實際資料來自 data.items
  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? total) / pageSize));
  const displayTotal = data?.total ?? total;

  const columns = [
    { key: "invoiceNo", label: "關聯收據", className: "w-[140px]" },
    { key: "amount", label: "金額", className: "w-[120px] text-right" },
    { key: "type", label: "付款類型", className: "w-[100px]" },
    { key: "method", label: "付款方式", className: "w-[120px]" },
    { key: "payerName", label: "付款人", className: "min-w-[120px]" },
    { key: "paidAt", label: "付款日期", className: "w-[120px]" },
    { key: "receivedByName", label: "收款人", className: "w-[120px]" },
    { key: "note", label: "備註", className: "w-[150px]" },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {columns.map((col) => (
              <TableHead key={col.key} className={cn("text-xs font-semibold text-gray-600", col.className)}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                暫無付款紀錄
              </TableCell>
            </TableRow>
          ) : (
            items.map((payment) => (
              <TableRow
                key={payment.id}
                className="cursor-pointer transition-all hover:bg-blue-50 hover:shadow-sm"
                onClick={() => onPaymentClick?.(payment.id)}
              >
                <TableCell className="font-mono text-sm font-medium text-[#0078D4]">
                  {payment.invoice.invoiceNo}
                </TableCell>
                <TableCell className="text-sm text-right font-medium">
                  $ {payment.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <StatusBadge status={payment.type} />
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {paymentMethodLabels[payment.method] || payment.method}
                </TableCell>
                <TableCell className="text-sm text-gray-800">
                  {payment.payerName ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {format(new Date(payment.paidAt), "yyyy/MM/dd")}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {payment.receivedBy?.name ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-500 truncate max-w-[200px]">
                  {payment.note || "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* 分頁 */}
      {displayTotal > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-600">
            共 {displayTotal} 筆，第 {page} / {totalPages} 頁
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="px-3 py-1 text-sm rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-100"
            >
              上一頁
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="px-3 py-1 text-sm rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-100"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
