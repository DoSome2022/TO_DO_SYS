// server/routers/comment.ts
import { db } from "@/app/lib/prisma";
import { publicProcedure, router } from "../trpc";
import z from "zod";

export const CommentRouter = router({
    // 1. 新增留言
    createComment: publicProcedure
        .input(z.object({
            phaseId: z.string(),
            content: z.string(),
            // userId: z.string(), // 如果您的 Schema 有加上 userId 關聯留言者，請把這行註解解開
        }))
        .mutation(async ({ input }) => {
            const newComment = await db.comment.create({
                data: {
                    phaseId: input.phaseId,
                    content: input.content,
                    // userId: input.userId,
                },
            });
            return newComment;
        }),

    // 2. 獲取該階段的所有討論紀錄
    getCommentsByPhaseId: publicProcedure
        .input(z.object({
            phaseId: z.string(),
        }))
        .query(async ({ input }) => {
            return await db.comment.findMany({
                where: {
                    phaseId: input.phaseId,
                },
                // include: { user: true }, // 如果有 userId，記得 include 使用者資料來顯示頭像/名字
                orderBy: {
                    createdAt: 'asc', // 討論紀錄通常是舊的在上面，新的在下面 (asc)
                }
            });
        }),

    // 3. 刪除留言
    deleteComment: publicProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ input }) => {
            return await db.comment.delete({
                where: { id: input.id },
            });
        }),
});
