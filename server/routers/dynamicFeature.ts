// server/routers/dynamicFeature.ts
import { db } from "@/app/lib/prisma";
import { publicProcedure, router } from "../trpc";
import z from "zod";

// 定義 Config 的結構 (如果是 JSON)
// 這邊簡化為 any，實際建議用 zod 嚴格定義
const jsonSchema = z.custom<any>((val) => {
    try {
      return typeof val === 'object' ? val : JSON.parse(val as string);
    } catch {
      return false;
    }
  });

export const dynamicFeatureRouter = router({
    getAll: publicProcedure.query(async () => {
        return await db.dynamicFeature.findMany();
    }),

    create: publicProcedure.input(z.object({
        title: z.string(),       // 例如 "股市看板"
        key: z.string(),         // 例如 "stock_dashboard"
        type: z.enum(['LINK', 'IFRAME', 'MARKDOWN']),
        config: z.any(),         // 例如 { url: "..." }
    })).mutation(async ({ input }) => {
        return await db.dynamicFeature.create({
            data: {
                title: input.title,
                key: input.key,
                type: input.type,
                config: input.config ?? {}, // 確保不是 null
            }
        });
    }),

    delete: publicProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ input }) => {
        return await db.dynamicFeature.delete({
            where: { id: input.id }
        });
    }),
});
