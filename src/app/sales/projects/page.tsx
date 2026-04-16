"use client";

import SalesProjectManager from "@/components/sales/project/SalesProjectManager";



export default function SalesProjectPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Sales 頁面標題 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">專案總覽 (業務視角)</h1>
        <p className="text-muted-foreground mt-2">
          查看您負責的客戶專案，追蹤報價單轉換狀態，並監督 PM 執行進度。
        </p>
      </div>

      {/* 注入剛剛寫好的工業級 Sales 專案管理模組 */}
      <SalesProjectManager />

    </div>
  );
}
