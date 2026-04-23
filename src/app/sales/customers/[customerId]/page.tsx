// app/staff/customers/[customerId]/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/prisma";
import CustomerDetailClient from "@/components/staff/CustomerDetailClient";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function CustomerDetailPage({ params }: Props) {
  const session = await auth();
  const { customerId } = await params;

  // 檢查是否登入
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // 獲取當前 staff 的 ID（假設 session.user.id 是 staff ID）
  const staffId = session.user.id;

  // 檢查該客戶是否屬於這個 staff（權限檢查）
  const customer = await db.customer.findFirst({
    where: {
      id: customerId,
      // 根據您的業務邏輯，檢查客戶是否屬於這個 staff
      // 例如：透過專案或報價單關聯
      OR: [
        { quotations: { some: { salesId: staffId } } },
        { Project: { some: { salesId: staffId } } },
      ],
    },
    select: { id: true },
  });

  if (!customer) {
    notFound();
  }

  return (
    <CustomerDetailClient
      customerId={customerId}
      staffId={staffId}
    />
  );
}