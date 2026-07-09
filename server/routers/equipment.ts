// server/routers/equipment.ts


import { z } from "zod";

import { EquipmentStatus, EquipmentOwnership, BillingType } from "@prisma/client";
import { differenceInHours, differenceInDays } from "date-fns"; // 用來計算時間差
// 引入您剛剛建立的 schemas

import { protectedProcedure, publicProcedure, router } from "../trpc";
import { checkoutEquipmentSchema, createEquipmentSchema, returnEquipmentSchema, updateStatusSchema } from "@/lib/schemas/equipment";

export const equipmentRouter = router({

  // 1. 取得列表
  getAll: protectedProcedure
    .input(z.object({
      status: z.nativeEnum(EquipmentStatus).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input?.status) {
        where.status = input.status;
      }

      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { serialNumber: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      return ctx.db.equipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          // 只抓取「目前尚未歸還」的那一筆 log，用來顯示當前誰借走了
          logs: {
            where: { returnedAt: null },
            take: 1,
            include: { borrowedBy: true, project: true }
          },
          // 如果列表需要顯示縮圖，可以 include attachments
          // attachments: { take: 1 } 
        }
      });
    }),

  // 2. 取得詳情
getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const equipment = await ctx.db.equipment.findUnique({
        where: { id: input.id },
        include: {
          logs: {
            orderBy: { borrowedAt: 'desc' },
            include: {
              borrowedBy: true,
              issuedBy: true,
              receivedBy: true,
              project: true,
              usageSchedules: true,   // ★ 新增：顯示實際使用時間表
            },
          },
          attachments: true,
        },
      });

      if (!equipment) throw new Error("Equipment not found");
      return equipment;
    }),

  // 3. 建立
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      ownership: z.enum(["COMPANY_OWNED", "EXTERNAL_RENTAL"]),
      
      // 新增計費輸入
      billingType: z.nativeEnum(BillingType).optional().default(BillingType.NONE),
      price: z.number().min(0).optional().default(0),

      model: z.string().optional(),
      serialNumber: z.string().optional(), 
      value: z.number().optional(), 
      notes: z.string().optional(),
      team: z.string().optional(),
      supplierName: z.string().optional(),
      supplierContact: z.string().optional(),
      rentalDeadline: z.date().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.equipment.create({
        data: {
          name: input.name,
          ownership: input.ownership,
          billingType: input.billingType, // 寫入計費方式
          price: input.price,             // 寫入單價
          model: input.model,
          serialNumber: input.serialNumber,
          value: input.value, 
          notes: input.notes,
          team: input.team,
          supplierName: input.supplierName,
          supplierContact: input.supplierContact,
          rentalDeadline: input.rentalDeadline,
        },
      });
    }),

  // 4. 借出 (Transaction)
   checkout: protectedProcedure
    .input(checkoutEquipmentSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const equipment = await tx.equipment.findUnique({
          where: { id: input.equipmentId },
        });

        if (!equipment) throw new Error("設備不存在");
        if (equipment.status !== EquipmentStatus.AVAILABLE) {
          throw new Error(`設備目前無法借用 (狀態: ${equipment.status})`);
        }

        // 更新設備狀態為使用中
        await tx.equipment.update({
          where: { id: input.equipmentId },
          data: { status: EquipmentStatus.IN_USE },
        });
        const usageSchedules = input.usageSchedules ?? [];
        // 建立借用記錄 + 同時建立多筆使用時間表（nested create）
            const newLog = await tx.equipmentLog.create({
              data: {
                equipmentId: input.equipmentId,
                projectId: input.projectId,
                borrowedById: input.borrowedById,
                issuedById: input.issuedById ?? ctx.session.user.id,
                externalRecipient: input.externalRecipient,
                dueAt: input.dueAt,
                notes: input.notes,
                borrowedAt: new Date(),
                borrowDurationDays: input.borrowDurationDays,
                workItemId: input.workItemId,       // 保留（如果其他功能需要）
                staffTodoId: input.staffTodoId,
                  
                usageSchedules: {
                  create: usageSchedules.map((schedule) => ({
                    usageStart: schedule.usageStart,
                    usageEnd: schedule.usageEnd,
                    note: schedule.note,
                  })),
                },
              },
              include: {
                usageSchedules: true,
                borrowedBy: true,
                project: true,
              },
            });


        return newLog;
      });
    }),

  // 5. 歸還 (Transaction)
   checkin: protectedProcedure
  .input(
    z.object({
      equipmentId: z.string(),
      receivedById: z.string().optional(),
      notes: z.string().optional(),
      condition: z.string().optional(),
      usageEndTime: z.date().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    return ctx.db.$transaction(async (tx) => {
      const activeLog = await tx.equipmentLog.findFirst({
        where: {
          equipmentId: input.equipmentId,
          returnedAt: null,
        },
        include: {
          equipment: true,
        },
      });

      if (!activeLog) {
        throw new Error("No active loan found for this equipment");
      }

      const endTime = input.usageEndTime ?? new Date();

      const startTime =
        // 如果你的 schema 有 usageStartTime 才保留這行
        (activeLog as any).usageStartTime ?? activeLog.borrowedAt;

      if (endTime.getTime() < startTime.getTime()) {
        throw new Error("usageEndTime cannot be earlier than borrowed time");
      }

      const billingType = activeLog.equipment.billingType;
      const price = Number(activeLog.equipment.price ?? 0);

      let calculatedCost = 0;

      if (billingType === BillingType.HOURLY) {
        const hours = Math.ceil(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60),
        );
        calculatedCost = Math.max(1, hours) * price;
      } else if (billingType === BillingType.DAILY) {
        const days = Math.ceil(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24),
        );
        calculatedCost = Math.max(1, days) * price;
      } else {
        calculatedCost = 0;
      }

      await tx.equipmentLog.update({
        where: { id: activeLog.id },
        data: {
          returnedAt: new Date(),
          usageEndTime: endTime,
          totalCost: calculatedCost,
          receivedById: input.receivedById ?? ctx.session.user.id,
          notes: input.notes
            ? activeLog.notes
              ? `${activeLog.notes}\n[歸還]: ${input.notes}`
              : input.notes
            : activeLog.notes,
        },
      });

      let targetStatus: EquipmentStatus = EquipmentStatus.AVAILABLE;

      if (
        input.condition &&
        (input.condition.includes("壞") || input.condition.includes("修"))
      ) {
        targetStatus = EquipmentStatus.MAINTENANCE;
      }

      await tx.equipment.update({
        where: { id: input.equipmentId },
        data: {
          status: targetStatus,
        },
      });

      return {
        success: true,
        totalCost: calculatedCost,
      };
    });
  }),


  // 6. 更新狀態
  updateStatus: protectedProcedure
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.equipment.update({
        where: { id: input.id },
        data: {
          status: input.status,
          notes: input.notes, 
        },
      });
    }),

  // 7. 刪除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 檢查是否借出中
      const activeLog = await ctx.db.equipmentLog.findFirst({
        where: { equipmentId: input.id, returnedAt: null }
      });
      
      if (activeLog) {
        throw new Error("Cannot delete equipment that is currently checked out.");
      }

      // [注意] 若 Prisma schema 中 EquipmentLog 對 Equipment 沒設 onDelete: Cascade
      // 且該器材有歷史 Log，這裡的 delete 會失敗。
      // 解決方案 1: 改用軟刪除 (推薦)
      // return ctx.db.equipment.update({
      //   where: { id: input.id },
      //   data: { status: EquipmentStatus.SCRAPPED } // 假設有報廢狀態
      // });

      // 解決方案 2: 強制刪除 (包含所有歷史紀錄 - 危險！)
      // await ctx.db.equipmentLog.deleteMany({ where: { equipmentId: input.id }});
      
      // 目前維持原本的 delete，假設 Prisma Schema 有設 Cascade 或器材無歷史紀錄
      return ctx.db.equipment.delete({
        where: { id: input.id },
      });
    }),
  // 取得可供借用的公司設備 (狀態為 AVAILABLE)
  getAvailableEquipment: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = { status: EquipmentStatus.AVAILABLE };
      
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { model: { contains: input.search, mode: 'insensitive' } },
        ];
      }
      return ctx.db.equipment.findMany({
        where,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          model: true,
          serialNumber: true,
          price: true,
          billingType: true,
          ownership: true,
        }
      });
    }),


    // ==========================================
// 🆕 編輯設備
// ==========================================
update: protectedProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().min(1, "名稱必填").optional(),
      model: z.string().optional(),
      serialNumber: z.string().optional(),
      value: z.number().optional(),
      notes: z.string().optional(),
      team: z.string().optional(),
      ownership: z.enum(["COMPANY_OWNED", "EXTERNAL_RENTAL"]).optional(),
      supplierName: z.string().optional(),
      supplierContact: z.string().optional(),
      rentalDeadline: z.date().optional().nullable(),
      billingType: z.nativeEnum(BillingType).optional(),
      price: z.number().min(0).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return ctx.db.equipment.update({
      where: { id },
      data,
    });
  }),
// ==========================================
// 🆕 報廢設備
// ==========================================
scrap: protectedProcedure
  .input(
    z.object({
      id: z.string(),
      scrapReason: z.string().min(1, "請填寫報廢原因"),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // 檢查設備是否正在使用中
    const activeLog = await ctx.db.equipmentLog.findFirst({
      where: { equipmentId: input.id, returnedAt: null },
    });
    if (activeLog) {
      throw new Error("設備正在使用中，無法報廢。請先歸還設備。");
    }
    return ctx.db.equipment.update({
      where: { id: input.id },
      data: {
        status: "RETIRED",
        notes: input.scrapReason, // 報廢原因寫入 notes
      },
    });
  }),
// ==========================================
// 🆕 歸還設備（簡化版 — 給員工使用）
// ==========================================
staffCheckin: protectedProcedure
  .input(
    z.object({
      equipmentId: z.string(),
      notes: z.string().optional(),
      condition: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    return ctx.db.$transaction(async (tx) => {
      // 找當前未歸還的借用記錄
      const activeLog = await tx.equipmentLog.findFirst({
        where: {
          equipmentId: input.equipmentId,
          returnedAt: null,
          borrowedById: ctx.session.user.id, // 只能歸還自己借的
        },
        include: { equipment: true },
      });
      if (!activeLog) {
        throw new Error("找不到您的借用記錄，或該設備並非由您借用");
      }
      const endTime = new Date();
      // 計算費用（如果有計費）
      const billingType = activeLog.equipment.billingType;
      const price = Number(activeLog.equipment.price ?? 0);
      let calculatedCost = 0;
      const startTime = activeLog.usageStartTime ?? activeLog.borrowedAt;
      if (billingType === "HOURLY") {
        const hours = Math.ceil(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
        );
        calculatedCost = Math.max(1, hours) * price;
      } else if (billingType === "DAILY") {
        const days = Math.ceil(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)
        );
        calculatedCost = Math.max(1, days) * price;
      }
      // 更新借用記錄
      await tx.equipmentLog.update({
        where: { id: activeLog.id },
        data: {
          returnedAt: endTime,
          usageEndTime: endTime,
          totalCost: calculatedCost,
          notes: input.notes
            ? `${activeLog.notes || ""}\n[歸還備註]: ${input.notes}`
            : activeLog.notes,
          condition: input.condition as any || undefined,
        },
      });
      // 更新設備狀態為可用
      await tx.equipment.update({
        where: { id: input.equipmentId },
        data: { status: "AVAILABLE" },
      });
      return { success: true, totalCost: calculatedCost };
    });
  }),
// ==========================================
// 🆕 取得設備使用記錄（history）
// ==========================================
getHistory: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const equipment = await ctx.db.equipment.findUnique({
      where: { id: input.id },
      include: {
        logs: {
          orderBy: { borrowedAt: "desc" },
          include: {
            borrowedBy: { select: { id: true, name: true } },
            issuedBy: { select: { id: true, name: true } },
            receivedBy: { select: { id: true, name: true } },
            project: { select: { id: true, title: true } },
          },
        },
        maintenanceRecords: {
          orderBy: { startDate: "desc" },
        },
        purchaseItems: {
          include: { purchase: true },
        },
      },
    });
    if (!equipment) throw new Error("設備不存在");
    // 整理成歷史時間軸格式
    const history: any[] = [];
    // 加入借用/歸還紀錄
    for (const log of equipment.logs) {
      history.push({
        type: "BORROW",
        date: log.borrowedAt,
        description: `借出給 ${log.borrowedBy?.name || "外部人員"}${log.project ? `（專案：${log.project.title}）` : ""}`,
        details: log,
      });
      if (log.returnedAt) {
        history.push({
          type: "RETURN",
          date: log.returnedAt,
          description: `歸還${log.condition ? `（狀況：${log.condition}）` : ""}`,
          details: log,
        });
      }
    }
    // 加入維修紀錄
    for (const maintenance of equipment.maintenanceRecords) {
      history.push({
        type: "MAINTENANCE",
        date: maintenance.startDate,
        description: `維修：${maintenance.description}（${maintenance.type}）`,
        details: maintenance,
      });
      if (maintenance.endDate) {
        history.push({
          type: "MAINTENANCE_END",
          date: maintenance.endDate,
          description: `維修完成，費用 $${maintenance.cost}`,
          details: maintenance,
        });
      }
    }
    // 按日期降序排序
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return history;
  }),

});
