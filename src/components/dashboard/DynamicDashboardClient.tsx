// components/dashboard/DynamicDashboardClient.tsx 
"use client";

import WorkItemsViewer from "@/components/WorkItemsViewer";
// import TodoListViewer from "@/components/TodoListViewer";    // ← 🆕 引入
import StaffTodoManager from "@/components/StaffTodoManager";
import ProjectCalendar from "./ProjectCalendar";

import PmDashboard from "./PmDashboard";
import SalesDashboard_index from "./SalesDashboard";
// import AdminDashboard from "./AdminDashboard";


import { useDynamicFeatures, useHasPermission, useUserProfile } from "../../../hooks/useUserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AdminDashboardCustomizable } from "./admin/AdminDashboardCustomizable";

export default function DynamicDashboardClient() {
  const { data: profile, isLoading } = useUserProfile();
  const hasPermission = useHasPermission();
  const dynamicFeatures = useDynamicFeatures();

  console.log(" DAta : ", profile , " -- END -- ")

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center">載入工作台中...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-red-500">載入失敗，請重新登入</div>;
  }

  const isAdmin = 
  profile.role === "ADMIN" || 
  profile.role === "SUPER_ADMIN" || 
  hasPermission("ADMIN_ACCESS") || 
  hasPermission("DASHBOARD_ADMIN");
  const isPM   = hasPermission("PROJECT_MANAGE") || hasPermission("PM_DASHBOARD");
  const isSales = hasPermission("QUOTATION_CREATE") || hasPermission("SALES_DASHBOARD");

  // ✨ 判斷員工身分：有 PROJECT_MANAGE 或 WORKITEM_VIEW 都算
  const isStaffOrPM = isPM || hasPermission("WORKITEM_VIEW_OWN") || hasPermission("WORKITEM_VIEW_ALL");

  return (
    <div className="container mx-auto p-6 space-y-10">
      {/* 頂部問候 */}
      <div>
        <h1 className="text-4xl font-bold">早安，{profile.name}</h1>
        <p className="text-xl text-muted-foreground mt-1">
          {profile.position ? `${profile.position} • 工作台` : "個人工作台"}
        </p>
      </div>

      {/* 職位專屬 Dashboard 區域 */}
      <div className="space-y-6">
        {isAdmin && <AdminDashboardCustomizable />}
        {isPM && <PmDashboard />}
        {isSales && <SalesDashboard_index />}
      </div>

      {/* ============================================ */}
      {/* ✨ 角色感知的「我的工作項目」區域              */}
      {/* ============================================ */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">我的工作項目</h2>

        <div className="space-y-6">
          {/* 
            情況 A：Staff / PM 
            → 顯示「專案任務 (WorkItems)」+「個人待辦 (Staff_TODO)」
          */}

{isAdmin && (
  <>

    
    {/* ✨ Admin 全覽行事曆 */}
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">📅 全專案行事曆</h2>
      <ProjectCalendar />
    </div>
  </>
)}

{isPM && (
  <>
  
    
    {/* ✨ Admin 全覽行事曆 */}
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">📅 我的工作月曆</h2>
      <ProjectCalendar />
    </div>
  </>
)}

{isSales && (
  <>

    
    {/* ✨ Admin 全覽行事曆 */}
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">📅 我的工作月曆</h2>
      <ProjectCalendar />
    </div>
  </>
)}

          {isStaffOrPM && (
            <>
                {/* ✨ 行事曆：放在工作項目最上方 */}
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">📅 我的工作月曆</h3>
      <ProjectCalendar />
    </div>

              {/* 專案任務（只有 Staff/PM 才有） */}
              <WorkItemsViewer 
                initialStaffId={profile.id} 
                isPmMode={isPM} 
              />

              {/* 個人待辦清單 */}
              {/* <TodoListViewer mode="staff" /> */}
              <StaffTodoManager />
            </>
          )}

          {/* 
            情況 B：純 Sales（沒有專案任務權限）
            → 只顯示「個人待辦 (Staff_TODO)」
          */}
          {isSales && !isStaffOrPM && (
            // <TodoListViewer mode="staff" />
            <StaffTodoManager />
          )}

          {/* 
            情況 C：什麼權限都沒有
            → 至少也顯示待辦
          */}
          {!isStaffOrPM && !isSales && !isAdmin && (
            // <TodoListViewer mode="staff" />
            <StaffTodoManager />
          )}
        </div>
      </div>

      {/* DynamicFeature 動態渲染區塊 */}
      {dynamicFeatures.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">其他功能模組</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dynamicFeatures.map((feature: any) => (
              <DynamicFeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      )}

      {/* 權限控制示範區 */}
      <div className="pt-8 border-t">
        {/* <h3 className="text-lg font-medium mb-4">權限控制示範</h3> */}
        <div className="flex flex-wrap gap-3">
          {hasPermission("PROJECT_CREATE") && (
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm">可建立專案</span>
          )}
          {hasPermission("QUOTATION_CREATE") && (
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm">可建立報價單</span>
          )}
          {hasPermission("USER_CREATE") && (
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm">可新增員工</span>
          )}
        </div>
      </div>
    </div>
  );
}

// DynamicFeatureCard 保持不變
function DynamicFeatureCard({ feature }: { feature: any }) {
  const config = typeof feature.config === "string" 
    ? JSON.parse(feature.config) 
    : feature.config || {};

  return (
    <Card className="hover:shadow-md transition">
      <CardHeader>
        <CardTitle className="text-lg">{feature.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{feature.type}</p>
        
        {feature.type === "LINK" && config.url && (
          <a 
            href={config.url} 
            target="_blank"
            className="text-primary hover:underline"
          >
            前往連結 →
          </a>
        )}

        {feature.type === "IFRAME" && config.url && (
          <div className="text-sm text-amber-600">已啟用嵌入框架（需額外實作）</div>
        )}
      </CardContent>
    </Card>
  );
}
