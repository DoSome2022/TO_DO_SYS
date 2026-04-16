// app/quotations/create/page.tsx

import SalesCreateProjectClient from "@/components/sales/project/SalesCreateProjectClient";
import { Suspense } from "react";
// 確認這個路徑有指向你剛剛建立的大腦元件

export default function QuotationCreatePage() {
  return (
    // 給頁面一個乾淨的灰色背景，這樣我們寫的微軟風格白色表單卡片就會浮現出來
    <div className="min-h-screen bg-[#f3f2f1] p-4 md:p-8">
      
      {/* 
        使用 Suspense 包裹，因為裡面有用到 useSearchParams 
        在還沒抓到 URL 參數前，會先顯示 fallback 的 Loading 文字
      */}
      <Suspense 
        fallback={
          <div className="flex justify-center items-center h-64 text-[#605e5c] text-[14px] animate-pulse">
            載入報價單表單中...
          </div>
        }
      >
        {/* 這裡就是你剛才寫好的大腦元件 */}
        <SalesCreateProjectClient />
      </Suspense>

    </div>
  );
}
