// server/lib/version.service.ts
import { db } from "@/app/lib/prisma";

/**
 * 建立版本快照：把當前報價單內容凍結成一個版本
 */
export async function createVersionSnapshot(
  quotationId: string,
  changeLog?: string
) {
  // 1. 取得當前報價單完整資料
  const quotation = await db.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true },
  });

  if (!quotation) throw new Error("報價單不存在");

  // 2. 計算下一個版本號
  const lastVersion = await db.quotationVersion.findFirst({
    where: { quotationId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  // 3. 把舊的最新版本標記取消
  await db.quotationVersion.updateMany({
    where: { quotationId, isLatest: true },
    data: { isLatest: false },
  });

  // 4. 建立快照 JSON
  const snapshot = {
    title: quotation.title,
    customerPrice: Number(quotation.customerPrice),
    note: quotation.note,
    items: quotation.items.map((item) => ({
      id: item.id,
      customName: item.customName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      serviceId: item.serviceId,
    })),
  };

  // 5. 建立版本記錄
  const version = await db.quotationVersion.create({
    data: {
      quotationId,
      versionNumber,
      title: quotation.title,
      status: quotation.status,
      baseCost: quotation.baseCost,
      agreedCost: quotation.agreedCost,
      customerPrice: quotation.customerPrice,
      pmBudget: quotation.pmBudget,
      totalAmount: quotation.totalAmount,
      notes: quotation.note,
      changeLog: changeLog || `第 ${versionNumber} 版`,
      isLatest: true,
      snapshot,
    },
  });

  // 6. 更新報價單的 currentVersionId
  await db.quotation.update({
    where: { id: quotationId },
    data: { currentVersionId: version.id },
  });

  return version;
}

/**
 * 回滾到指定版本
 */
export async function revertToVersion(
  quotationId: string,
  targetVersionId: string,
  changeLog?: string
) {
  // 1. 取得目標版本
  const targetVersion = await db.quotationVersion.findUnique({
    where: { id: targetVersionId },
  });

  if (!targetVersion) throw new Error("目標版本不存在");

  // 2. 解析 snapshot
  const snapshot = targetVersion.snapshot as any;

  // 3. 更新報價單主表內容（回滾）
  await db.quotation.update({
    where: { id: quotationId },
    data: {
      title: snapshot.title,
      customerPrice: snapshot.customerPrice,
      note: snapshot.note,
    },
  });

  // 4. 刪除現有項目，重建為目標版本的項目
  await db.quotationItem.deleteMany({ where: { quotationId } });

  for (const item of snapshot.items) {
    await db.quotationItem.create({
      data: {
        quotationId,
        serviceId: item.serviceId,
        customName: item.customName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      },
    });
  }

  // 5. 重新計算總金額
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

  // 6. 建立新版本作為回滾後的記錄
  const newVersion = await createVersionSnapshot(
    quotationId,
    changeLog || `回滾至第 ${targetVersion.versionNumber} 版`
  );

  return newVersion;
}
