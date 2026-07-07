// // src/components/dashboard/SalesDashboard/index.tsx
// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Plus } from "lucide-react";
// import SalesStatsCards from "./SalesStatsCards";
// import SalesQuotationsList from "./SalesQuotationsList";
// import SalesProjectsList from "./SalesProjectsList";
// import SalesCustomersList from "./SalesCustomersList";
// import CreateQuotationDialog from "./CreateQuotationDialog";
// import QuickActions from "./QuickActions";
// import { 
//   useSalesCustomers, 
//   useSalesProjects, 
//   useSalesQuotations, 
//   useSalesStats 
// } from "../../../../hooks/useQuotation";

// export default function SalesDashboard() {
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
//   const [activeTab, setActiveTab] = useState("quotations");

//   const { data: stats, isLoading: statsLoading } = useSalesStats();
//   const { data: quotations, refetch: refetchQuotations } = useSalesQuotations();
//   const { data: projects, isLoading: projectsLoading } = useSalesProjects();
//   const { data: customers, isLoading: customersLoading } = useSalesCustomers();

//   const isLoading = statsLoading || projectsLoading || customersLoading;

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-pulse text-muted-foreground">載入銷售數據中...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* 統計卡片 */}
//       <SalesStatsCards stats={stats} />

//       {/* 快速操作區域 - 微軟風格 */}
//       <div>
//         <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
//           <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
//           快速操作
//         </h2>
//         <QuickActions />
//       </div>

//       {/* Tabs 區域 */}
//       <div>
//         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//           <div className="flex justify-between items-center mb-4">
//             <TabsList>
//               <TabsTrigger value="quotations">
//                 報價單 ({quotations?.length || 0})
//               </TabsTrigger>
//               <TabsTrigger value="projects">
//                 我的專案 ({projects?.length || 0})
//               </TabsTrigger>
//               <TabsTrigger value="customers">
//                 客戶列表 ({customers?.length || 0})
//               </TabsTrigger>
//             </TabsList>

//             <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
//               <Plus className="w-4 h-4 mr-2" />
//               新增報價單
//             </Button>
//           </div>

//           <TabsContent value="quotations">
//             <SalesQuotationsList 
//               quotations={quotations || []} 
//               onStatusChange={refetchQuotations}
//             />
//           </TabsContent>

//           <TabsContent value="projects">
//             <SalesProjectsList projects={projects || []} />
//           </TabsContent>

//           <TabsContent value="customers">
//             <SalesCustomersList customers={customers || []} />
//           </TabsContent>
//         </Tabs>
//       </div>

//       <CreateQuotationDialog
//         open={isCreateDialogOpen}
//         onOpenChange={setIsCreateDialogOpen}
//         onSuccess={refetchQuotations}
//       />
//     </div>
//   );
// }



// src/components/dashboard/SalesDashboard/index.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";
import SalesStatsCards from "./SalesStatsCards";
import SalesQuotationsList from "./SalesQuotationsList";
import SalesProjectsList from "./SalesProjectsList";
import SalesCustomersList from "./SalesCustomersList";

import CreateQuotationDialog from "./CreateQuotationDialog";
import CreatePurchaseDialog from "./CreatePurchaseDialog"; // ← 🆕 新增
import QuickActions from "./QuickActions";
import { 
  useSalesCustomers, 
  useSalesProjects, 
  useSalesQuotations, 
  useSalesStats 
} from "../../../../hooks/useQuotation";
import { usePurchaseList } from "../../../../hooks/usePurchase"; // ← 🆕 新增

export default function SalesDashboard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatePurchaseOpen, setIsCreatePurchaseOpen] = useState(false); // ← 🆕
  const [activeTab, setActiveTab] = useState("quotations");

  const { data: stats, isLoading: statsLoading } = useSalesStats();
  const { data: quotations, refetch: refetchQuotations } = useSalesQuotations();
  const { data: projects, isLoading: projectsLoading } = useSalesProjects();
  const { data: customers, isLoading: customersLoading } = useSalesCustomers();
  const { data: purchaseData } = usePurchaseList(); // ← 🆕

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
              {/* ⬇️ 🆕 新增採購 Tab */}
              <TabsTrigger value="purchases">
                <ShoppingCart className="w-4 h-4 mr-1" />
                採購記錄 ({purchaseData?.total || 0})
              </TabsTrigger>
            </TabsList>

            {/* 根據當前 tab 顯示不同按鈕 */}
            {activeTab === "quotations" && (
              <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                新增報價單
              </Button>
            )}
            {activeTab === "purchases" && (
              <Button onClick={() => setIsCreatePurchaseOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                新增採購記錄
              </Button>
            )}
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

          {/* ⬇️ 🆕 採購記錄 Tab */}

        </Tabs>
      </div>

      <CreateQuotationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refetchQuotations}
      />

      {/* ⬇️ 🆕 新增採購對話框 */}
      <CreatePurchaseDialog
        open={isCreatePurchaseOpen}
        onOpenChange={setIsCreatePurchaseOpen}
      />
    </div>
  );
}
