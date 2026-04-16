// server/routers/staffposition.ts

import { db } from "@/app/lib/prisma";
import { publicProcedure, router } from "../trpc";
import z from "zod";

export const staffPositionRouter = router({
    getAllstaffPosition: publicProcedure.query(async()=>{
        const staffPositions = await db.position.findMany({
            include:{
                permissions: true,
                features: true,
            }
        });
        return staffPositions;
    }),
    getstaffPositionById: publicProcedure.input(z.object({
        id: z.string(),
    })).query(async({input})=>{
        const staffPosition = await db.position.findUnique({
            where: {
                id: input.id
            },
            include: {
                permissions: true,
                features: true,
            }
        })
        return staffPosition;
    }),
createStaffPosition: publicProcedure.input(z.object({
    name: z.string(),
    featureIds: z.array(z.string()),
    permissionIds: z.array(z.string()),
})).mutation(async ({ input }) => {
    // 檢查是否存在
    const existingPosition = await db.position.findFirst({
        where: {
            name: input.name,
        }
    });

    if (existingPosition) {
        // 如果存在，就更新它
        return await db.position.update({
            where: { id: existingPosition.id },
            data: {
                permissions: {
                    set: input.permissionIds.map(id => ({ id }))
                },
                features: {
                    set: input.featureIds.map(id => ({ id }))
                }
            }
        });
    }

    // 不存在才建立
    return await db.position.create({
        data: {
            name: input.name,
            permissions: {
                connect: input.permissionIds.map(id => ({ id }))
            },
            features: {
                connect: input.featureIds.map(id => ({ id }))
            }
        }
    });
}),
    updateStaffPosition: publicProcedure.input(z.object({
        id: z.string(),
        name: z.string(),
        permissionIds: z.array(z.string()), // 更新時也要傳入完整的 ID 列表
        featureIds: z.array(z.string()), 
        
    })).mutation(async({input})=>{
        return await db.position.update({
            where: {
                id: input.id
            },
            data: {
                name: input.name,
                
                permissions: {
                    set: input.permissionIds.map(id => ({ id }))
                },

                features: {
                    set: input.featureIds.map(id => ({ id }))
                }
                
            }
        })
    }),

    togglePositionStatus: publicProcedure.input(z.object({
        id: z.string(),
        isActive: z.boolean(),
    })).mutation(async ({ input }) => {
        return await db.position.update({
            where: { id: input.id },
            data: { isActive: input.isActive }
        });
    }),

})