// components/dashboard/DynamicDashboardClient.tsx
"use client";

import WorkItemsViewer from "@/components/WorkItemsViewer";
import PmDashboard from "./PmDashboard";
import SalesDashboard_index from "./SalesDashboard";
import AdminDashboard from "./AdminDashboard";

import { useDynamicFeatures, useHasPermission, useUserProfile } from "../../../hooks/useUserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function DynamicDashboardClient() {
  const { data: profile, isLoading } = useUserProfile();
  const hasPermission = useHasPermission();
  const dynamicFeatures = useDynamicFeatures();

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center">載入工作台中...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-red-500">載入失敗，請重新登入</div>;
  }

  // === 推薦修改：改用權限判斷，而非 position 字串比對 ===
  const isAdmin = hasPermission("ADMIN_ACCESS") || hasPermission("DASHBOARD_ADMIN"); 
  const isPM   = hasPermission("PROJECT_MANAGE") || hasPermission("PM_DASHBOARD");
  const isSales = hasPermission("QUOTATION_CREATE") || hasPermission("SALES_DASHBOARD");

  // 如果您仍想保留 position 作為後備方案，可以這樣寫：
  // const positionName = (profile.position || "").toLowerCase();
  // const isAdmin = hasPermission("ADMIN_ACCESS") || positionName.includes("admin");

  return (
    <div className="container mx-auto p-6 space-y-10">
      {/* 頂部問候 */}
      <div>
        <h1 className="text-4xl font-bold">早安，{profile.name}</h1>
        <p className="text-xl text-muted-foreground mt-1">
          {profile.position ? `${profile.position} • 工作台` : "個人工作台"}
        </p>
      </div>

      {/* 職位專屬 Dashboard 區域 — 使用權限控制 */}
      <div className="space-y-6">
        {isAdmin && <AdminDashboard />}
        {isPM && <PmDashboard />}
        {isSales && <SalesDashboard_index />}
      </div>

      {/* 通用工作項目區域 */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">我的工作項目</h2>
        <WorkItemsViewer 
          initialStaffId={profile.id} 
          isPmMode={isPM} 
        />
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
        <h3 className="text-lg font-medium mb-4">權限控制示範</h3>
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

// DynamicFeatureCard 元件保持不變
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