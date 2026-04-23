"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, HardDrive, Briefcase, Settings } from "lucide-react";
// 備註：未來你可以在這裡引入 trpc 來獲取全站的統計數據
// import { trpc } from "@/utils/trpc"; 

export default function AdminDashboard() {
  // 示範：未來可串接 tRPC 取得這些統計資料
  // const { data: stats } = trpc.admin.getDashboardStats.useQuery();

  return (
    <div className="space-y-6 bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-xl border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            管理員控制台 (Admin Control Panel)
          </h2>
          <p className="text-sm text-muted-foreground">全站數據總覽與系統設置</p>
        </div>
      </div>

      {/* 數據統計區塊 (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">系統總用戶數</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground mt-1">包含內部員工與外部客戶</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">運行中專案</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">+3 個專案本週即將到期</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">設備資產狀態</CardTitle>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">56 / 62</div>
            <p className="text-xs text-muted-foreground mt-1">6 台借出或維修中</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">系統動態職位</CardTitle>
            <Settings className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">點擊前往權限管理中心</p>
          </CardContent>
        </Card>
      </div>

      {/* 管理員快速操作區 */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">快速操作</h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm hover:bg-slate-50 transition text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> 管理帳號與權限
          </button>
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm hover:bg-slate-50 transition text-sm flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> 設備盤點與採購
          </button>
          {/* <button className="px-4 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm hover:bg-slate-50 transition text-sm flex items-center gap-2">
            <Settings className="w-4 h-4" /> 全域參數設定
          </button> */}
        </div>
      </div>
    </div>
  );
}
