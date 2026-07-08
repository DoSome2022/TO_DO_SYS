// server/lib/quotation.service.ts
import { db } from "@/app/lib/prisma";

export async function updateQuotationTotal(quotationId: string) {
  const items = await db.quotationItem.findMany({
    where: { quotationId },
    select: { subtotal: true },
  });

  const totalAmount = items.reduce(
    (sum: number, item: any) => sum + Number(item.subtotal),
    0
  );

  await db.quotation.update({
    where: { id: quotationId },
    data: { totalAmount },
  });
}
