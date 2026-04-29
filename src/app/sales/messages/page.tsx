// app/sales/messages/page.tsx

import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/app/lib/prisma";
import SalesMessagesClient from "./SalesMessagesClient";


interface PageProps {
  searchParams: Promise<{ customerId?: string }>;
}

export default async function SalesMessagesPage({ searchParams }: PageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const params = await searchParams;
  const customerId = params.customerId;

  if (!customerId) {
    redirect("/sales/customers");
  }

  const salesId = session.user.id;

  // 獲取客戶資訊
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      companyname: true,
      contactname: true,
      contactphone: true,
      companyemail: true,
    },
  });

  if (!customer) {
    redirect("/sales/customers");
  }

  // 獲取該客戶的所有專案和報價單
  const projects = await db.project.findMany({
    where: { 
      customerId: customerId,
      OR: [
        { salesId: salesId },
        { quotation: { salesId: salesId } }
      ]
    },
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
    },
    orderBy: { createdAt: 'desc' }
  });

  // 處理 Decimal 轉換
  const projectsData = projects.map((project) => ({
    id: project.id,
    title: project.title,
    status: project.status,
    quotation: project.quotation
      ? {
          id: project.quotation.id,
          status: project.quotation.status,
          customerPrice: project.quotation.customerPrice 
            ? project.quotation.customerPrice.toNumber() 
            : null,
        }
      : null,
  }));

  // 獲取一般客服對話
  const rawGeneralMessages = await db.salesCustomerConversation.findMany({
    where: { 
      customerId: customerId,
      salesId: salesId,
    },
    orderBy: { createdAt: 'asc' },
  });

  const generalMessages = rawGeneralMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    isCustomer: msg.senderType === 'CUSTOMER',
    createdAt: msg.createdAt,
  }));

  // 獲取專案報價單對話
  const rawProjectMessages = await db.externalQuoteMessage.findMany({
    where: {
      quotation: { 
        customerId: customerId,
        salesId: salesId,
      }
    },
    orderBy: { createdAt: 'asc' },
  });

  const projectMessages = rawProjectMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    isCustomer: !!msg.senderCustomerId,
    quotationId: msg.quotationId,
    createdAt: msg.createdAt,
  }));

  return (
    <Suspense fallback={<SalesMessagesSkeleton />}>
      <SalesMessagesClient
        salesId={salesId}
        customerId={customerId}
        customerName={customer.companyname || customer.name || customer.contactname || "客戶"}
        projects={projectsData}
        generalMessages={generalMessages}
        projectMessages={projectMessages}
      />
    </Suspense>
  );
}

function SalesMessagesSkeleton() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}