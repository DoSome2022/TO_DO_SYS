// src/features/admin/finance/hooks/useInvoicePrint.ts

"use client";

import { useCallback, useRef } from "react";

// ── 與 Router getById 回傳結構對齊 ──
interface InvoiceItemData {
  id: string;
  name: string;          // 來自 quotationItem.customName
  quantity: number;
  unitPrice: number;
  amount: number;        // 來自 quotationItem.subtotal
}

interface PaymentData {
  id: string;
  amount: number;
  paymentType: string;   // Prisma PaymentType Enum
  paymentMethod: string; // Prisma PaymentMethod Enum
  receivedBy: { id: string; name: string } | null;
  receivedAt: Date;
  note: string | null;
  createdAt: Date;
}

// ── PrintPreview 內部用的資料格式 ──
export interface PrintInvoiceData {
  invoiceNumber: string;
  status: string;
  projectCode?: string;
  projectName?: string;
  customerName?: string;
  companyName?: string | null;
  issuedAt?: string | Date | null;
  dueDate?: string | Date | null;
  salesName?: string | null;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    amount: number;            // ← 用 amount 對齊 router
  }>;
  payments?: Array<{
    amount: number;
    type: string;              // ← paymentType
    method: string;            // ← paymentMethod
    paidAt: string | Date | null;
  }>;
}

// ── Hook ──
export function useInvoicePrint() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /**
   * 將 Router getById 回傳的原始資料，
   * 轉換成 PrintPreview 可接受的格式
   */
  const preparePrintData = useCallback(
    (invoice: {
      invoiceNumber: string;
      status: string;
      projectCode?: string;
      projectName?: string;
      customerName?: string;
      companyName?: string | null;
      issuedAt?: string | Date | null;
      dueDate?: string | Date | null;
      salesName?: string | null;
      totalAmount: number;
      paidAmount: number;
      balance: number;
      notes?: string;
      items: InvoiceItemData[];
      payments?: PaymentData[];
    }): PrintInvoiceData => {
      return {
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        projectCode: invoice.projectCode,
        projectName: invoice.projectName,
        customerName: invoice.customerName,
        companyName: invoice.companyName,
        issuedAt: invoice.issuedAt,
        dueDate: invoice.dueDate,
        salesName: invoice.salesName,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        balance: invoice.balance,
        notes: invoice.notes,
        items: invoice.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,       // ← 對齊 router 回傳的欄位名稱
        })),
        payments: invoice.payments?.map((p) => ({
          amount: p.amount,
          type: p.paymentType,       // ← router 回傳 paymentType
          method: p.paymentMethod,   // ← router 回傳 paymentMethod
          paidAt: p.receivedAt,      // ← router 回傳 receivedAt
        })),
      };
    },
    []
  );

  // ── 列印預覽元件 ──
  const PrintPreview = useCallback(
    ({ data }: { data: PrintInvoiceData }) => {
      const fmtDate = (d: string | Date | null | undefined) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      };

      const fmtMoney = (n: number) =>
        `$ ${n.toLocaleString()}`;

      const statusLabel: Record<string, string> = {
        UNPAID: "未付款",
        PARTIAL: "部分付款",
        PAID: "已付款",
        CANCELLED: "已取消",
      };

      return (
        <div
          ref={printRef}
          className="print-content p-8 bg-white"
          style={{ fontFamily: "Noto Sans TC, sans-serif" }}
        >
          {/* 標題 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">收 據</h1>
            <p className="text-sm text-gray-500 mt-1">INVOICE</p>
          </div>

          {/* 收據編號 + 狀態 */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-lg font-bold">{data.invoiceNumber}</p>
              <p className="text-sm text-gray-500">{data.projectName}</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 text-sm border rounded">
                {statusLabel[data.status] ?? data.status}
              </span>
            </div>
          </div>

          {/* 客戶資訊 */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded">
            <div>
              <p className="text-xs text-gray-400">客戶名稱</p>
              <p className="text-sm font-medium">{data.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">公司抬頭</p>
              <p className="text-sm font-medium">{data.companyName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">開立日期</p>
              <p className="text-sm">{fmtDate(data.issuedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">到期日期</p>
              <p className="text-sm">{fmtDate(data.dueDate)}</p>
            </div>
          </div>

          {/* 明細表 */}
          <table className="w-full text-sm mb-6 border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 text-xs text-gray-500">項次</th>
                <th className="text-left py-2 text-xs text-gray-500">品項名稱</th>
                <th className="text-right py-2 text-xs text-gray-500">數量</th>
                <th className="text-right py-2 text-xs text-gray-500">單價</th>
                <th className="text-right py-2 text-xs text-gray-500">小計</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2 text-gray-400">{idx + 1}</td>
                  <td className="py-2">{item.name}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">{fmtMoney(item.unitPrice)}</td>
                  <td className="py-2 text-right font-medium">
                    {fmtMoney(item.amount)}   {/* ← amount 不是 subtotal */}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td colSpan={4} className="py-2 text-right font-bold">總計</td>
                <td className="py-2 text-right font-bold text-lg">
                  {fmtMoney(data.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* 金額總覽 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded text-center">
              <p className="text-xs text-gray-500">總金額</p>
              <p className="text-lg font-bold text-blue-600">
                {fmtMoney(data.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded text-center">
              <p className="text-xs text-gray-500">已收款</p>
              <p className="text-lg font-bold text-green-600">
                {fmtMoney(data.paidAmount)}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded text-center">
              <p className="text-xs text-gray-500">未收款</p>
              <p className="text-lg font-bold text-orange-600">
                {fmtMoney(data.balance)}
              </p>
            </div>
          </div>

          {/* 收款紀錄 */}
          {data.payments && data.payments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">收款紀錄</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1 text-xs text-gray-500">日期</th>
                    <th className="text-left py-1 text-xs text-gray-500">方式</th>
                    <th className="text-right py-1 text-xs text-gray-500">金額</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-1">{fmtDate(p.paidAt)}</td>
                      <td className="py-1">{p.method}</td>
                      <td className="py-1 text-right">{fmtMoney(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 備註 */}
          {data.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-1">備註</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {data.notes}
              </p>
            </div>
          )}

          {/* 頁尾 */}
          <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
            <p>此表單為電腦自動產生，無需簽章</p>
          </div>
        </div>
      );
    },
    []
  );

  return {
    handlePrint,
    PrintPreview,
    preparePrintData,
    printRef,
  };
}
