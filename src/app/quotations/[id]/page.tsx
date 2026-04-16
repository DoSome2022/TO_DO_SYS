// 這是一個 Server Component (不加 "use client")
import { db } from "@/app/lib/prisma";
import ExternalChatClient from "@/components/chat/ExternalChatClient";

// 🌟 引入 Auth.js v5 的 auth 函數 
// (請確認你的 auth.ts 檔案位在哪裡，通常在根目錄的 "@/auth" 或 "@/app/auth")
import { auth } from "@/auth"; 

export default async function QuotationPage({ params }: { params: { id: string } }) {
  const quotationId = params.id;
  
  // 🌟 Auth.js v5 取得 session 的寫法，超級簡單！
  const session = await auth();
  
  // 1. 在 Server 端判斷身分
  let isEmployee = false;
  
  // v5 的 session.user 預設就會有 id (如果你的 callbacks 有設定)
  if (session?.user?.id) {
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (user) {
      isEmployee = true;
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">報價單詳情 - {quotationId}</h1>

      <div className="grid grid-cols-2 gap-8">
        {/* 左側：報價單內容 */}
        <div className="bg-gray-50 p-4 border">
          <h2>這裡是報價單的商品細節...</h2>
        </div>

        {/* 右側：聊天室區塊 */}
        <div className="space-y-6">
          
          {/* 外部聊天室 (大家都看得到) */}
          <div>
            <h3 className="font-bold mb-2">與客戶對話</h3>
            <ExternalChatClient quotationId={quotationId} />
          </div>

          {/* 內部聊天室 (Server 端判斷，只有員工才 render) */}
          {isEmployee && (
            <div>
              <h3 className="font-bold mb-2 text-red-600">內部討論 (客戶不可見)</h3>
              {/* <InternalChatClient quotationId={quotationId} /> */}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
