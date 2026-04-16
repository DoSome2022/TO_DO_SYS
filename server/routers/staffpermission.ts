// server/routers/staffpermission.ts

import { db } from "@/app/lib/prisma";
import { publicProcedure, router } from "../trpc";
import z from "zod";


export const staffPermissionRouter = router({
    getAll: publicProcedure.query(async () => {
        return await db.permission.findMany({
            orderBy: { isActive: 'desc' } // 把啟用的排前面
        });
    }),
    // 2. 給「下拉選單」用的：只顯示 isActive = true
    getActivePermissions: publicProcedure.query(async () => {
        return await db.permission.findMany({
            where: { isActive: true }
        });
    }),
    createPermission: publicProcedure.input(z.object({
        name: z.string(),
        code: z.string(),
        description: z.string(),
    })).mutation(async ({ input }) => {
        return await db.permission.create({
            data: input
        });
    }),
        // 4. 🔥 新增：切換啟用/禁用狀態
    toggleStatus: publicProcedure.input(z.object({
        id: z.string(),
        isActive: z.boolean(),
    })).mutation(async ({ input }) => {
        return await db.permission.update({
            where: { id: input.id },
            data: { isActive: input.isActive }
        });
    }),
})