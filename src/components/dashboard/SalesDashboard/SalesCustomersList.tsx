// src/components/dashboard/SalesDashboard/SalesCustomersList.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone,
  Mail,
  Building,
  ExternalLink,
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageCircle, // ✅ 引入對話圖示
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Quotation {
  id: string;
  status: string;
  customerPrice: number | null;
  createdAt: Date;
}

interface Customer {
  id: string;
  name: string | null;
  companyname: string | null;
  contactname: string | null;
  contactphone: string | null;
  companyemail: string | null;
  quotations: Quotation[];
  _count: {
    quotations: number;
    Project: number;
  };
}

interface SalesCustomersListProps {
  customers: Customer[];
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "WON":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">✅ 成交</Badge>;
    case "LOST":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">❌ 流失</Badge>;
    case "NEGOTIATING":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">💬 交涉中</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-50">📄 草稿</Badge>;
  }
};

export default function SalesCustomersList({ customers }: SalesCustomersListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <Building className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">暫無客戶資料</p>
            <p className="text-sm text-muted-foreground">
              當您建立第一張報價單後，客戶會自動出現在這裡
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (customer.companyname?.toLowerCase().includes(searchLower) || false) ||
      (customer.name?.toLowerCase().includes(searchLower) || false) ||
      (customer.contactname?.toLowerCase().includes(searchLower) || false) ||
      (customer.contactphone?.includes(searchLower) || false)
    );
  });

  console.log("data : ", customers , "-- End -- ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">客戶列表</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 搜尋 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋客戶名稱、聯絡人或電話..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 客戶列表 */}
        <div className="space-y-4">
          {filteredCustomers.map((customer) => (
            <Collapsible
              key={customer.id}
              open={expandedCustomer === customer.id}
              onOpenChange={() =>
                setExpandedCustomer(
                  expandedCustomer === customer.id ? null : customer.id
                )
              }
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  {/* 客戶基本資訊區 - 可點擊展開 */}
                  <CollapsibleTrigger className="w-full">
                    <div className="p-4 flex justify-between items-start hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {(customer.companyname || customer.name || "客")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              {customer.companyname || customer.name || "未命名客戶"}
                            </h3>
                            {customer.companyname && customer.name && (
                              <p className="text-sm text-muted-foreground">
                                聯絡人：{customer.name}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                              {customer.contactphone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {customer.contactphone}
                                </span>
                              )}
                              {customer.companyemail && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {customer.companyemail}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">報價單</p>
                              <p className="text-xl font-bold">
                                {customer._count.quotations}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">成交專案</p>
                              <p className="text-xl font-bold text-green-600">
                                {customer._count.Project}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 hover:bg-accent hover:text-accent-foreground">
                          {expandedCustomer === customer.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* 展開的詳細內容 */}
                  <CollapsibleContent>
                    <div className="border-t p-4 space-y-4 bg-muted/30">
                      {/* 最近報價單 */}
                      {customer.quotations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            最近報價單
                          </h4>
                          <div className="space-y-2">
                            {customer.quotations.slice(0, 5).map((quote) => (
                              <div
                                key={quote.id}
                                className="flex justify-between items-center p-2 bg-background rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  {getStatusBadge(quote.status)}
                                  <span className="text-sm font-medium">
                                    ${quote.customerPrice?.toLocaleString() || 0}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(quote.createdAt), "yyyy/MM/dd", {
                                      locale: zhTW,
                                    })}
                                  </span>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/quotations/${quote.id}`}>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </Button>
                              </div>
                            ))}
                          </div>
                          {customer.quotations.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              還有 {customer.quotations.length - 5} 張報價單
                            </p>
                          )}
                        </div>
                      )}

                      {/* ✨ 修改重點：操作按鈕區域加上對話按鈕 */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {/* 1. 與客戶對話按鈕 (主要按鈕色調，引導業務溝通) */}
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                          <Link href={`/sales/customers/${customer.id}`}>
                            <MessageCircle className="w-4 h-4 mr-1" />
                            與客戶對話
                          </Link>
                        </Button>
                        
                        {/* 2. 新增報價單 */}
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/quotations/create?customerId=${customer.id}`}>
                            <FileText className="w-4 h-4 mr-1" />
                            新增報價單
                          </Link>
                        </Button>
                        
                        {/* 3. 查看資料 */}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/sales/customers/${customer.id}`}>
                            <ExternalLink className="w-4 h-4 mr-1" />
                            查看資料
                          </Link>
                        </Button>
                      </div>

                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            沒有符合條件的客戶
          </div>
        )}
      </CardContent>
    </Card>
  );
}
