// components/dashboard/PmDashboard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useHasPermission } from "../../../hooks/useUserProfile";
import PmTodoManager from "../pm/todo/PmTodoManager";

// ✅ 1. 引入剛剛建立好的工業級 PM 任務模組


export default function PmDashboard() {
  const hasPermission = useHasPermission();

  return (
    // 加上簡單的淡入動畫，讓載入更平滑
    <div className="space-y-8 animate-in fade-in duration-500"> 
      
      {/* 頂部標題 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">專案經理 (PM) 工作台</h1>
        <p className="text-muted-foreground mt-2">管理專案階段、審核工作版本、分配任務</p>
      </div>

      {/* 原有的數據統計與快捷操作卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 專案總覽卡片 */}
        <Card className="hover:shadow-md transition">
          <CardHeader>
            <CardTitle>進行中的專案</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">12</p>
            <p className="text-sm text-muted-foreground mt-2">本月進度</p>
          </CardContent>
        </Card>

        {/* 待審核任務 */}
        <Card className="hover:shadow-md transition">
          <CardHeader>
            <CardTitle>待 PM 確認的工作</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold text-amber-600">
            8
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <Card className="hover:shadow-md transition">
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasPermission("PROJECT_CREATE") && (
              <Button asChild className="w-full bg-[#005fb8] hover:bg-[#004e98]">
                <Link href="/projects/new">建立新專案</Link>
              </Button>
            )}
            <Button variant="outline" asChild className="w-full border-slate-300">
              <Link href="/projects">查看所有專案</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ✅ 2. 插入微軟風格的任務管理器 */}
      <div className="pt-4 border-t border-slate-200">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-800">任務分派與追蹤</h2>
          <p className="text-sm text-muted-foreground mt-1">
            從報價單轉換來的專案，請在此分派給底下的員工並追蹤子任務進度。
          </p>
        </div>
        
        {/* 這裡就是剛剛封裝好的聰明元件 (Smart Component) */}
        <PmTodoManager />
      </div>

    </div>
  );
}
