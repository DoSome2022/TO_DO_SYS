"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SalesStatsCards from "./SalesStatsCards";
import SalesQuotationsList from "./SalesQuotationsList";
import SalesProjectsList from "./SalesProjectsList";
import SalesCustomersList from "./SalesCustomersList";
import CreateQuotationDialog from "./CreateQuotationDialog";
import QuickActions from "./QuickActions";
import { 
  useSalesCustomers, 
  useSalesProjects, 
  useSalesQuotations, 
  useSalesStats 
} from "../../../../hooks/useQuotation";

export default function SalesDashboard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("quotations");

  const { data: stats, isLoading: statsLoading } = useSalesStats();
  const { data: quotations, refetch: refetchQuotations } = useSalesQuotations();
  const { data: projects, isLoading: projectsLoading } = useSalesProjects();
  const { data: customers, isLoading: customersLoading } = useSalesCustomers();

  const isLoading = statsLoading || projectsLoading || customersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">載入銷售數據中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <SalesStatsCards stats={stats} />

      {/* 快速操作區域 - 微軟風格 */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
          快速操作
        </h2>
        <QuickActions />
      </div>

      {/* Tabs 區域 */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="quotations">
                報價單 ({quotations?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="projects">
                我的專案 ({projects?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="customers">
                客戶列表 ({customers?.length || 0})
              </TabsTrigger>
            </TabsList>

            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              新增報價單
            </Button>
          </div>

          <TabsContent value="quotations">
            <SalesQuotationsList 
              quotations={quotations || []} 
              onStatusChange={refetchQuotations}
            />
          </TabsContent>

          <TabsContent value="projects">
            <SalesProjectsList projects={projects || []} />
          </TabsContent>

          <TabsContent value="customers">
            <SalesCustomersList customers={customers || []} />
          </TabsContent>
        </Tabs>
      </div>

      <CreateQuotationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refetchQuotations}
      />
    </div>
  );
}