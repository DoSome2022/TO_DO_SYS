//src/app/sales/customers/page.tsx

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/prisma";
import SalesCustomersList from "@/components/dashboard/SalesDashboard/SalesCustomersList";

export default async function CustomersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const salesId = session.user.id;

  // 1. 修改這裡：加入 title 和 projectId 到 quotations 的 select
  const rawCustomers = await db.customer.findMany({
    where: {
      OR: [
        { quotations: { some: { salesId: salesId } } },
        { Project: { some: { salesId: salesId } } },
        { SalesCustomerConversation: { some: { salesId: salesId } } }
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
          title: true,        // ✅ 加入 title
          status: true,
          customerPrice: true,
          createdAt: true,
          projectId: true,    // ✅ 加入 projectId
        }
      },
      _count: {
        select: {
          quotations: { where: { salesId: salesId } },
          Project: { where: { salesId: salesId, status: "COMPLETED" } },
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  // 2. 處理 Decimal 轉換
  const formattedCustomers = rawCustomers.map(customer => ({
    ...customer,
    quotations: customer.quotations.map(quote => ({
      ...quote,
      customerPrice: quote.customerPrice ? Number(quote.customerPrice) : null,
    }))
  }));

  return <SalesCustomersList customers={formattedCustomers} />;
}