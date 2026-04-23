// app/projects/[projectId]/quotation/[quotationId]/page.tsx
import { db } from "@/app/lib/prisma";
import QuotationDetailClient from "@/components/quotation/QuotationDetailClient";
import { notFound } from "next/navigation";

type Props = {
  params: {
    projectId: string;
    quotationId: string;
  };
};

export default async function QuotationDetailPage({ params }: Props) {
  const { projectId, quotationId } = await params;

  // 獲取專案和報價單基本資訊
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      customerId: true,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <QuotationDetailClient
      quotationId={quotationId}
      projectId={projectId}
      projectTitle={project.title}
    />
  );
}