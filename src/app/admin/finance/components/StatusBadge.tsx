// src/features/admin/finance/components/StatusBadge.tsx
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColorMap: Record<string, { dot: string; label: string }> = {
  // InvoiceStatus
  UNPAID: { dot: "bg-orange-500", label: "未付款" },
  PARTIAL: { dot: "bg-yellow-500", label: "部分付款" },
  PAID: { dot: "bg-green-500", label: "已付款" },
  CANCELLED: { dot: "bg-gray-400", label: "已取消" },
  // PaymentType
  DOWN_PAYMENT: { dot: "bg-blue-500", label: "訂金" },
  MILESTONE: { dot: "bg-indigo-500", label: "里程碑" },
  FINAL: { dot: "bg-purple-500", label: "尾款" },
  FULL: { dot: "bg-teal-500", label: "全額" },
  // 可擴充
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = statusColorMap[status] || { dot: "bg-gray-300", label: status };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        "bg-gray-50 text-gray-700 border border-gray-200",
        className
      )}
    >
      <span
        className={cn(
          "inline-block w-2 h-2 rounded-full",
          color.dot
        )}
      />
      {color.label}
    </span>
  );
}
