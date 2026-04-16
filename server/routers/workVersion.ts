// server/routers/workVersion.ts
import { db } from "@/app/lib/prisma";
import { publicProcedure, router } from "../trpc";
import z from "zod";

export const WorkVersionRouter = router({
    // 1. 員工功能：建立新版本，上傳到專案池子 (不綁定 Phase)
    createVersion: publicProcedure
        .input(z.object({
            projectId: z.string(), // ★ 必填：知道是上傳到哪個專案的池子
            userId: z.string(),    // ★ 必填：知道是哪個員工上傳的
            versionName: z.string(),      // 版本名稱 (例如 "首頁切版 v1", "登入API v2")
            contentUrl: z.string().optional(), // 檔案連結或 Github commit 網址
            note: z.string().optional(), // 若有備註或文字內容可以放這
        }))
        .mutation(async ({ input }) => {
            const newVersion = await db.workVersion.create({
                data: {
                    projectId: input.projectId,
                    userId: input.userId,
                    versionName: input.versionName,
                    contentUrl: input.contentUrl,
                    note: input.note,
                    // 注意：這裡不傳入 phaseId，所以預設為 null (留在池子裡)
                },
            });
            return newVersion;
        }),

    // 2. PM 功能：將指定的版本從池子中挑選出來，綁定到特定的「階段」
    assignVersionToPhase: publicProcedure
        .input(z.object({
            versionId: z.string(), // 選擇要綁定的 WorkVersion ID
            phaseId: z.string(),   // 指定要放入哪個 Phase ID
        }))
        .mutation(async ({ input }) => {
            const updatedVersion = await db.workVersion.update({
                where: {
                    id: input.versionId,
                },
                data: {
                    phaseId: input.phaseId, // ★ 更新 phaseId 來完成綁定
                },
            });
            return updatedVersion;
        }),

    // 3. PM 功能：如果選錯了，或是該版本不合格，把它從階段中拔除 (退回池子)
    removeVersionFromPhase: publicProcedure
        .input(z.object({
            versionId: z.string(), // 選擇要退回的 WorkVersion ID
        }))
        .mutation(async ({ input }) => {
            const revertedVersion = await db.workVersion.update({
                where: {
                    id: input.versionId,
                },
                data: {
                    phaseId: null, // ★ 把 phaseId 設為 null，它就會脫離該階段，回到總池子裡
                },
            });
            return revertedVersion;
        }),
        
    // (補充) 獲取某個專案底下「所有未被綁定階段」的版本 (PM 挑選用)
    getUnassignedVersions: publicProcedure
        .input(z.object({
            projectId: z.string(),
        }))
        .query(async ({ input }) => {
            return await db.workVersion.findMany({
                where: {
                    projectId: input.projectId,
                    phaseId: null, // ★ 只找還沒被放進任何階段的
                },
                include: {
                    user: true, // 帶出上傳員工的資訊
                },
                orderBy: {
                    createdAt: 'desc', // 最新的排在最上面
                }
            });
        }),
});
