// src/features/admin/finance/components/InvoiceTable.tsx
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
import type { InvoiceSearchResult } from "../types";
import { format } from "date-fns";
import { useRouter } from "next/navigation";


import { useState } from "react";


interface InvoiceTableProps {
  data?: InvoiceSearchResult;
  isLoading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onInvoiceClick?: (invoiceId: string) => void;
  accentColor?: string;    // ← 加上這行  ✅
}

export function InvoiceTable({
  data,
  isLoading,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onInvoiceClick,
}: InvoiceTableProps) {
  const router = useRouter();   // ← 加上這行

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? total) / pageSize));
  const displayTotal = data?.total ?? total;
  const [isCreatingTail, setIsCreatingTail] = useState(false);


  const columns = [
    { key: "invoiceNo", label: "收據編號", className: "w-[150px]" },
    { key: "projectCode", label: "專案編號", className: "w-[120px]" },
    { key: "customerName", label: "客戶名稱", className: "min-w-[150px]" },
    { key: "totalAmount", label: "總金額", className: "w-[120px] text-right" },
    { key: "balanceAmount", label: "未付金額", className: "w-[120px] text-right" },
    { key: "status", label: "狀態", className: "w-[100px]" },
    { key: "issuedDate", label: "開立日期", className: "w-[120px]" },
    { key: "dueDate", label: "到期日", className: "w-[120px]" },
  ];


  
  const handleRowClick = (invoiceId: string) => {
    if (onInvoiceClick) {
      onInvoiceClick(invoiceId);
    } else {
      router.push(`/admin/finance/invoices/${invoiceId}`);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* ↑ 移除外層 onClick */}
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
                暫無收據資料
              </TableCell>
            </TableRow>
          ) : (
            items.map((invoice) => (
              <TableRow
                key={invoice.id}
                className={cn(
                  "cursor-pointer transition-all hover:bg-blue-50 hover:shadow-sm",
                  invoice.status === "UNPAID" && "bg-orange-50/30"
                )}
                onClick={() => handleRowClick(invoice.id)}  // ← 改用 handleRowClick
              >
                <TableCell className="font-mono text-sm font-medium text-[#0078D4]">
                  {invoice.invoiceNo}
                </TableCell>
                <TableCell className="text-sm font-mono text-gray-600">
                  {invoice.project?.code ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-800">
                  {invoice.customer?.companyname ?? invoice.customer?.name ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-right font-medium">
                  $ {invoice.totalAmount.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-right font-medium">
                  <span className={invoice.balanceAmount > 0 ? "text-orange-600" : "text-green-600"}>
                    $ {invoice.balanceAmount.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {format(new Date(invoice.issuedDate), "yyyy/MM/dd")}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {invoice.dueDate ? format(new Date(invoice.dueDate), "yyyy/MM/dd") : "—"}
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
