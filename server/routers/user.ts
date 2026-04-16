// server/routers/user.ts
import { hasPermission, protectedProcedure, router } from "../trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/app/lib/prisma";

export const userRouter = router({
  // 取得目前登入者的完整資料（推薦前端最常用）
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        position: {
          include: {
            permissions: { 
              select: { 
                id: true, 
                code: true, 
                name: true, 
                description: true 
              } 
            },
            features: true,   // DynamicFeature
          },
        },
      },
    });

    if (!user) throw new Error("使用者不存在");

    return {
      id: user.id,
      name: user.name,
      role: user.role,  
      position: user.position?.name || null,
      isActive: user.isActive,
      permissions: user.position?.permissions || [],
      dynamicFeatures: user.position?.features || [],
    };
  }),

  // 僅取得權限代碼（給前端 hasPermission 使用）
  getMyPermissionCodes: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        position: {
          include: { permissions: { select: { code: true } } },
        },
      },
    });
    return user?.position?.permissions.map((p) => p.code) ?? [];
  }),

  // 取得所有活躍員工（包含職位）
  getAllStaff: protectedProcedure.query(async () => {
    return await db.user.findMany({
      where: { isActive: true },
      include: { position: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  // 給 PM 分派任務用的員工清單
  getStaffs: protectedProcedure.query(async () => {
    return await db.user.findMany({
      where: { isActive: true },
      include: { position: true },
      orderBy: { name: "asc" },
    });
  }),

  // 切換員工啟用狀態
  toggleUserStatus: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: { id: input.userId },
        data: { isActive: input.isActive },
      });
    }),

  // 建立新員工（Admin 用）
  createUser: protectedProcedure
    // .use(hasPermission("USER_CREATE"))
    .input(z.object({
      name: z.string().min(1),
      role: z.enum(["PM", "STAFF", "ADMIN", "SALES"]),
      positionId: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const defaultPassword = "123456";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      return await db.user.create({
        data: {
          name: input.name,
          role: input.role,
          positionId: input.positionId,
          password: hashedPassword,
          isActive: true,
        },
      });
    }),

  // 更新員工
  updateUser: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      role: z.enum(["PM", "STAFF", "ADMIN", "SALES"]),
      positionId: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          role: input.role,
          positionId: input.positionId,
          isActive: input.isActive,
        },
      });
    }),

  // 取得可用的職位清單（下拉選單用）
getPositionsForDropdown: protectedProcedure.query(async () => {
  return await db.position.findMany({
    where: { isActive: true },
    include: {
      permissions: {  // ✅ 加入 permissions
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
        }
      }
    },
    orderBy: { name: "asc" },
  });
}),

  getUserById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        include: {
          position: {
            include: {
              permissions: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  description: true,
                }
              },
              features: true,
            }
          },
        },
      });

      if (!user) throw new Error("使用者不存在");

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        positionId: user.positionId,
        position: user.position?.name || null,
        isActive: user.isActive,
        permissions: user.position?.permissions || [],
        dynamicFeatures: user.position?.features || [],
      };
    }),


});