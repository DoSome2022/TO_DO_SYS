// src/types/quotation.ts
export type QuotationItem = {
  id: string;
  serviceId: string;
  customName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  service: {
    name: string;
    description: string | null;
  };
};

export type QuotationVersion = {
  id: string;
  versionNumber: number;
  title: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  isLatest: boolean;
  notes: string | null;
};

export type QuotationDetail = {
  id: string;
  title: string;
  status: string;
  customerPrice: number | null;
  agreedCost: number | null;
  baseCost: number | null;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  companyProfile: {
    name: string;
    logoUrl: string | null;
    address: string | null;
    phone: string | null;
    taxId: string | null;
  } | null;
  items: QuotationItem[];
  versions: QuotationVersion[];
  currentVersionId: string;
};