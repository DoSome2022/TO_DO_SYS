// src/app/quotations/[id]/page.tsx

import { db } from "@/app/lib/prisma";
import ExternalChatClient from "@/components/chat/ExternalChatClient";
import { auth } from "@/auth"; 

export default async function QuotationPage({ params }: { params: { id: string } }) {
  const quotationId = params.id;
  const session = await auth();

  // 1️⃣ 在 Server 端先撈報價單（含 number）
  const quotation = await db.quotation.findUnique({
    where: { id: quotationId },
    select: {
      number: true,
      title: true,
      customerId: true,
      salesId: true,
    },
  });

  // 2️⃣ 判斷身分
  let isEmployee = false;
  if (session?.user?.id) {
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (user) {
      isEmployee = true;
    }
  }

  return (
    <div className="p-8">
      {/* ✨ 顯示報價單編號在最上方 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-muted-foreground text-lg font-mono tracking-wider">
            {quotation?.number || '編號生成中...'}
          </span>
          <span className="text-gray-400">|</span>
          <span>{quotation?.title || '報價單詳情'}</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* 左側：報價單內容 */}
        <div className="bg-gray-50 p-4 border">
          <h2>這裡是報價單的商品細節...</h2>
        </div>

        {/* 右側：聊天室區塊 */}
        <div className="space-y-6">
          
          {/* 外部聊天室 — ✨ 傳遞 quotationNumber prop */}
          <div>
            <h3 className="font-bold mb-2">與客戶對話</h3>
            <ExternalChatClient 
              quotationId={quotationId} 
              quotationNumber={quotation?.number || ''}  // ← 新增這行
            />
          </div>

          {/* 內部聊天室 */}
          {isEmployee && (
            <div>
              <h3 className="font-bold mb-2 text-red-600">內部討論 (客戶不可見)</h3>
              {/* 如果要顯示編號，也傳下去 */}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
