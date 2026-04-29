import { redirect } from "next/navigation";
import CustomerProfileClient from "./_components/CustomerProfileClient";
import { auth } from "@/auth";
import { db } from "@/app/lib/prisma";

export default async function CustomerProfilePage() {
  // 1. 驗證登入狀態
  const session = await auth();
  
  if (!session || !session.user) {
    redirect("/auth/login"); // 沒登入就踢回登入頁
  }

  // 假設使用者的 id 就是 customerId (依據您的 NextAuth 設定)
  const customerId = session.user.id as string;
  const userName = session.user.name || "貴賓";

  // 2. 從 Prisma 撈取該客人的專案與報價單 (先存入 raw 變數)
  const rawProjectsData = await db.project.findMany({
    where: { customerId: customerId },
    select: {
      id: true,
      title: true,
      status: true,
      quotation: {
        select: {
          id: true,
          customerPrice: true,
          status: true,
        }
      }
    }
  });

  // console.log("Data :", rawProjectsData , "-- End --"); // 🔍 檢查原始資料格式


  // ✨ 處理 Decimal 型別轉換
  const projectsData = rawProjectsData.map((project) => ({
    id: project.id,
    title: project.title,
    status: project.status,
    quotation: project.quotation 
      ? {
          id: project.quotation.id,
          status: project.quotation.status,
          // 如果有值，使用 .toNumber() 將 Decimal 轉為一般 number
          customerPrice: project.quotation.customerPrice ? project.quotation.customerPrice.toNumber() : null,
        }
      : null
  }));

  // 3. 從 Prisma 撈取「一般客服對話」 (SalesCustomerConversation)
  const rawGeneralMessages = await db.salesCustomerConversation.findMany({
    where: { customerId: customerId },
    orderBy: { createdAt: 'asc' },
  });

  const generalMessages = rawGeneralMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    // 如果 senderType 是 CUSTOMER，代表是客人發送的
    isCustomer: msg.senderType === 'CUSTOMER', 
    createdAt: msg.createdAt,
  }));

  // 4. 從 Prisma 撈取「專案(報價單)對話」 (ExternalQuoteMessage)
  const rawProjectMessages = await db.externalQuoteMessage.findMany({
    where: {
      quotation: { customerId: customerId }
    },
    orderBy: { createdAt: 'asc' },
  });

  const projectMessages = rawProjectMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    // 如果 senderCustomerId 有值，代表是客人發送的
    isCustomer: !!msg.senderCustomerId, 
    quotationId: msg.quotationId,
    createdAt: msg.createdAt,
  }));

  // 5. 將所有真實資料打包，傳遞給 Client Component 進行渲染
  return (
    <CustomerProfileClient 
      customerId={customerId} 
      userName={userName}
      projects={projectsData}
      generalMessages={generalMessages}
      projectMessages={projectMessages}
    />
  );
}
