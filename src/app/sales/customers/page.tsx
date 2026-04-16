import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/prisma"; // 確保這個路徑指向你專案中的 prisma 實例
import SalesCustomersList from "@/components/dashboard/SalesDashboard/SalesCustomersList";

export default async function CustomersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const salesId = session.user.id;

  // 1. 從資料庫撈取這個 Sales 負責的客戶
  // 邏輯：只要該客戶有被這個 Sales 報過價，或者是被指派為專案的 sales，就算是他的客戶
  const rawCustomers = await db.customer.findMany({
    where: {
      OR: [
        { quotations: { some: { salesId: salesId } } },
        { Project: { some: { salesId: salesId } } },
        { SalesCustomerConversation: { some: { salesId: salesId } } } // 如果對話也算的話
      ]
    },
    select: {
      id: true,
      name: true,
      companyname: true,
      contactname: true,
      contactphone: true,
      companyemail: true,
      quotations: {
        where: { salesId: salesId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          customerPrice: true,
          createdAt: true,
        }
      },
      _count: {
        select: {
          quotations: { where: { salesId: salesId } },
          Project: { where: { salesId: salesId, status: "COMPLETED" } }, // 這裡的狀態依你的定義修改
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  // 2. 處理 Decimal 到 Number 的轉換 (因為 Prisma 的 Decimal 傳到 Client 會報錯)
  const formattedCustomers = rawCustomers.map(customer => ({
    ...customer,
    quotations: customer.quotations.map(quote => ({
      ...quote,
      customerPrice: quote.customerPrice ? Number(quote.customerPrice) : null,
    }))
  }));

  // 3. 將資料作為 Props 傳給 Client Component
  return <SalesCustomersList customers={formattedCustomers} />;
}
