// server/lib/quotation-sync.service.ts
import { db } from "@/app/lib/prisma";

/**
 * 將報價單的服務項目同步為專案的 WorkItem
 * 在 WON→CONVERTED 時呼叫
 */
export async function syncQuotationItemsToWorkItems(
  quotationId: string,
  projectId: string
) {
  // 1. 取得報價單的所有項目
  const items = await db.quotationItem.findMany({
    where: { quotationId },
  });

  if (items.length === 0) return [];

  // 2. 為每個項目建立 WorkItem
  const workItems = [];
  for (const item of items) {
    const workItem = await db.workItem.create({
      data: {
        title: item.customName || "未命名服務",
        projectId,
        source: "QUOTATION",
        sourceQuotationItemId: item.id,
        isCompleted: false,
        isConfirmed: false,
        estimatedHours: 0,
      },
    });
    workItems.push(workItem);
  }

  return workItems;
}

/**
 * 當報價單項目被修改/刪除時，標記對應的 WorkItem 為暫停
 * 在 addItem / removeItem / revertToVersion 時呼叫
 */
export async function markWorkItemAsSuspended(
  quotationItemId: string,
  reason: string
) {
  const workItem = await db.workItem.findFirst({
    where: { sourceQuotationItemId: quotationItemId },
  });

  if (!workItem) return null;

  return db.workItem.update({
    where: { id: workItem.id },
    data: {
      suspendReason: reason,
    },
  });
}

/**
 * 當報價單新增項目時，建立對應的 WorkItem（如果已經有專案）
 */
export async function createWorkItemFromNewQuotationItem(
  quotationItemId: string,
  projectId: string,
  title: string
) {
  return db.workItem.create({
    data: {
      title,
      projectId,
      source: "QUOTATION",
      sourceQuotationItemId: quotationItemId,
      isCompleted: false,
      isConfirmed: false,
      estimatedHours: 0,
    },
  });
}
