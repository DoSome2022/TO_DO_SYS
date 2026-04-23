import { db } from "@/app/lib/prisma";
import { publicProcedure, router } from "../trpc";
import z from "zod";


export const phaseRouter = router({

    getPhase: publicProcedure
        .query(async () => {
            const phases = await db.projectPhase.findMany();
            return phases;
        }),
    
    getPhaseById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const phase = await db.projectPhase.findUnique({
                where: { id: input.id },
            });
            return phase;
        }),
            // ★ 新增這支 API：透過 projectId 找出該專案所有的 Phase
    getPhasesByProjectId: publicProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            const phases = await db.projectPhase.findMany({
                where: { projectId: input.projectId },
                orderBy: { order: 'asc' }, // 依照順序排列
                // 如果需要連同這個階段的成品一起拿回來，可以加上 include
                include: {
                    selectedVersions: {
                        include: {
                            user: true
                        }
                    }, 
                    deliverables: true
                }
            });
            return phases;
        }),
    createPhase: publicProcedure
        .input(z.object({
            projectId: z.string(), // ★ 必填：必須知道是建立在哪個專案底下
            name: z.string(),
            description: z.string().optional(),
            startDate: z.coerce.date().optional(), // 允許建立時順便押時間
            endDate: z.coerce.date().optional(),
            }))
        .mutation(async ({ input }) => {
                    // (選擇性) 找出目前該專案有幾個階段，自動計算下一個排序 (order)
        const existingPhasesCount = await db.projectPhase.count({
            where: { projectId: input.projectId }
        });
            const newPhase = await db.projectPhase.create({
                data: {
                projectId: input.projectId, // ★ 補上
                name: input.name,
                description: input.description,
                startDate: input.startDate,
                endDate: input.endDate,
                order: existingPhasesCount, // 新階段排在最後面
                },
            });
            return newPhase;
        }),
    updatePhase: publicProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            status: z.string().optional(), // ★ 讓 PM 可以改狀態
            order: z.number().int().optional(), // ★ 允許調整順序
            startDate: z.coerce.date().nullable().optional(), 
            endDate: z.coerce.date().nullable().optional(),
            }))
        .mutation(async ({ input }) => {
            const { id, ...updateData } = input;

                // ★ 貼心邏輯：如果 PM 把狀態改成 COMPLETED，自動押上完成時間
                let completedAt = undefined;
                if (updateData.status === "COMPLETED") {
                    completedAt = new Date();
                } else if (updateData.status && updateData.status !== "COMPLETED") {
                    completedAt = null; // 如果退回 IN_PROGRESS，就把完成時間清空
                }
            const updatedPhase = await db.projectPhase.update({
                    where: {
                        id: input.id,
                    },
                    data: {
                        ...updateData,
                        completedAt: completedAt !== undefined ? completedAt : undefined,
                    }
                })
            return updatedPhase;
        }),
        assignVersionToPhase: publicProcedure
        .input(z.object({
            versionId: z.string(),
            phaseId: z.string(),
        }))
        .mutation(async ({ input }) => {
            const updatedVersion = await db.workVersion.update({
                where: { id: input.versionId },
                data: {
                    phaseId: input.phaseId,           // 關鍵：關聯到階段
                },
                include: {
                    user: true,
                    phase: true
                }
            });

            return updatedVersion;
        }),
})