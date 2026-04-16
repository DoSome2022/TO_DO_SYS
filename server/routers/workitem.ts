// server/routers/workItem.ts
// todolist
import { db } from "@/app/lib/prisma";
import { publicProcedure, router } from "../trpc";
import z from "zod";

export const workItemRouter = router({
    getworkItemAll: publicProcedure.query(async()=>{
        return await db.workItem.findMany({
            include:{
                staff: true,
                project: true
            }
        });
    }),
    
    getworkItemById: publicProcedure.input(z.object({
        id: z.string(),
    })).query(async({input})=>{
        return await db.workItem.findUnique({
            where: {
                id: input.id,
            },
            include:{
                staff: true,
                project: true
            }
        })
    }),

    getWorkItemsByDate: publicProcedure
    .input(z.object({
        staffId: z.string(),
        date: z.date(),
    }))
    .query(async({input}) => {
            const startDate = new Date(input.date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);

            return await db.workItem.findMany({
                where: {
                    staffId: input.staffId,
                    createdAt: {
                        gte: startDate,
                        lt: endDate,
                    },
                },
                include:{
                    staff: true,
                    project: true
                },
                orderBy:{
                    createdAt:'asc'
                }
            });
    }),

    createWorkItem: publicProcedure.input(z.object({
        title: z.string(),
        isCompleted:z.boolean().optional().default(false),
        isConfirmed:z.boolean().optional().default(false),
        targetDate:z.date().optional().nullable(),
        projectId:z.string().optional().nullable(),
        staffId:z.string().optional().nullable(),
    })).mutation(async({input})=>{
        return await db.workItem.create({
            data: {
                title: input.title,
                isCompleted: input.isCompleted,
                isConfirmed: input.isConfirmed,
                targetDate: input.targetDate,
                project: input.projectId 
                    ? { connect: { id: input.projectId } } 
                    : undefined,
                staff: input.staffId 
                    ? { connect: { id: input.staffId } } 
                    : undefined,
            }
        })
    }),

  // server/routers/workItem.ts - getWorkItemsByStaff

    getWorkItemsByStaff: publicProcedure
    .input(z.object({
      staffId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      if (!input.staffId) return [];

      return await db.workItem.findMany({
        where: {
          staffId: input.staffId,
          ...(input.startDate && input.endDate ? {
             targetDate: {
                 gte: input.startDate,
                 lte: input.endDate,
             }
          } : {})
        },
        include: {
          project: {
            select: { title: true }
          },
          // ✅✅✅ 完整關聯所有裝備資訊
          equipmentLogs: {
            include: {
              equipment: {
                select: { name: true, model: true, billingType: true, price: true }
              },
              usageSchedules: true, // ✅ 把詳細使用時間表也帶出來
              // 如果還想看這筆借出記錄是誰借的，可以加上
              // borrowedBy: { select: { name: true } }
            },
            orderBy: { borrowedAt: 'desc' }
          }
        },
        orderBy: [
          { isCompleted: 'asc' },
          { targetDate: 'asc' } 
        ]
      });
    }),


    toggleComplete: publicProcedure
        .input(z.object({ 
            id: z.string(), 
            isCompleted: z.boolean() 
        }))
        .mutation(async ({ input }) => {
            return await db.workItem.update({
                where: { id: input.id },
                data: { isCompleted: input.isCompleted }
            });
        }),

    // ✅✅✅ 新增：更新任務執行日期的 Mutation ✅✅✅
    updateTargetDate: publicProcedure
        .input(z.object({
            id: z.string(),
            // 接收 ISO 字串格式的日期 (前端 toISOString 傳過來)
            targetDate: z.string().nullable() 
        }))
        .mutation(async ({ input }) => {
            return await db.workItem.update({
                where: { id: input.id },
                data: { 
                    // 將前端傳來的字串轉回 Prisma 需要的 Date 物件
                    targetDate: input.targetDate ? new Date(input.targetDate) : null 
                }
            });
        }),
});
