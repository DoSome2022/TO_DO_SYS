//src/features/admin/finance/types/index.ts

// === 定義列舉型別 ===
export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED";
export type PaymentType = "DOWN_PAYMENT" | "MILESTONE" | "FINAL" | "FULL";
export type PaymentMethod = "CASH" | "TRANSFER" | "CHECK" | "CREDIT_CARD" | "LINE_PAY" | "OTHER";

// ===== 搜索共用參數 =====
export interface FinanceSearchParams {
  year?: number;
  month?: number;
  day?: number;
  minAmount?: number;
  maxAmount?: number;
  keyword?: string;
  projectCode?: string;
  salesName?: string;
  customerName?: string;
  companyName?: string;
  page?: number;
  pageSize?: number;
  status?: InvoiceStatus;
  paymentType?: PaymentType;
  paymentMethod?: PaymentMethod;
}

// ===== 報價單 =====
export interface QuotationSearchResult {
  items: Array<{
    id: string;
    title: string;
    status: string;
    customerPrice: number | null;
    totalAmount: number;
    createdAt: Date;
    customer: { id: string; name: string | null; companyname: string | null };
    sales: { id: string; name: string | null };
    companyProfile: { id: string; name: string } | null;
    project: { id: string; code: string | null; title: string } | null;
    items: Array<{ service: { name: string } }>;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ===== 付款紀錄 =====
export interface PaymentSearchResult {
  items: Array<{
    id: string;
    amount: number;
    type: string;
    method: string;
    paidAt: Date;
    payerName: string | null;
    note: string | null;
    invoice: {
      invoiceNo: string;
      customer: { name: string | null; companyname: string | null };
      project: { code: string | null; title: string } | null;
      companyProfile: { name: string } | null;
    };
    receivedBy: { name: string | null } | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ===== 統計 =====
export interface FinanceSummary {
  totalInvoices: number;
  totalRevenue: number;
  outstandingBalance: number;
  partialPaymentCount: number;
  year: number;
}

export interface InvoiceSummary {
  totalRevenue: number;
  outstandingBalance: number;
  partialPaymentCount: number;
  paidCount: number;
  unpaidCount: number;
  cancelledCount: number;
}

export interface QuotationSummary {
  totalQuotations: number;
  wonQuotations: number;
  lostQuotations: number;
  pendingQuotations: number;
  winRate: number;
}

// === 泛型分頁結果 ===
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── 收據列表的單筆資料 ──
export interface InvoiceListItem {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  issuedDate: Date;
  dueDate: Date | null;
  notes: string | null;
  project: { id: string; code: string | null; title: string } | null;
  quotation: { id: string; title: string; sales: { name: string | null } | null } | null;
  customer: { id: string; name: string | null; companyname: string | null };
  companyProfile: { id: string; name: string } | null;
  createdBy: { id: string; name: string | null };
  payments: {
    id: string;
    amount: number;
    type: PaymentType;
    method: PaymentMethod;
    paidAt: Date;
  }[];
}

// ── 收據分頁搜尋結果 ──
export interface InvoiceSearchResult {
  items: InvoiceListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}



// 其他需要的介面
export interface QuotationItemDTO {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  customerPrice: number;
  costPrice?: number | null;
}
export interface QuotationDTO {
  id: string;
  number: string;
  project: { id: string; title: string; code: string | null };
  customer: { id: string; name: string; phone: string | null };
  items: QuotationItemDTO[];
  totalAmount: number;        // 注意：tRPC 回傳已將 Decimal 轉 number
  status: string;
  createdAt: string;
  updatedAt: string;
}
export interface InvoiceDTO {
  id: string;
  number: string;
  quotation?: { id: string; number: string } | null;
  project: { id: string; title: string; code: string | null };
  customer: { id: string; name: string };
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  payments: PaymentDTO[];
  createdAt: string;
}
export interface PaymentDTO {
  id: string;
  invoice: { id: string; number: string };
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  referenceNumber?: string | null;
  paidAt: string;
  note?: string | null;
}