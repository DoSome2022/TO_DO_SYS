// server/routers/user.ts
import { hasPermission, protectedProcedure, publicProcedure, router } from "../trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/app/lib/prisma";
import { TRPCError } from "@trpc/server";  // ← 🆕 加入這行


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

// server/routers/user.ts

  // ★ 正確版本：專門給 PM 指派專案成員使用的員工清單（只回傳 STAFF）
  getAssignableStaff: protectedProcedure
    .query(async () => {
      return await db.user.findMany({
        where: { 
          isActive: true,
          role: "STAFF"                    // 只允許一般員工
        },
        orderBy: { 
          name: "asc" 
        },
        // 使用 select + nested select（不要同時用 include）
        select: {
          id: true,
          name: true,
          email: true,
          position: {                      // 關聯的 position 只取需要的欄位
            select: {
              id: true,
              name: true,
            }
          }
        }
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

    updateProfile: protectedProcedure
    .input(
      z.object({
        email: z.string().email("請輸入有效的 Email").optional(),
        currentPassword: z.string().optional(),
        newPassword: z
          .string()
          .min(6, "新密碼至少 6 個字元")
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      // 1️⃣ 取得目前使用者
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, password: true, name: true },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "使用者不存在" });
      }
      const updateData: any = {};
      // 2️⃣ 如果要修改 Email
      if (input.email !== undefined) {
        // 檢查 Email 是否已被其他使用者使用
        const existingUser = await ctx.db.user.findUnique({
          where: { email: input.email },
        });
        if (existingUser && existingUser.id !== userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "此 Email 已被其他員工使用",
          });
        }
        updateData.email = input.email;
      }
      // 3️⃣ 如果要修改密碼
      if (input.newPassword) {
        // 必須提供目前密碼
        if (!input.currentPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "修改密碼必須提供目前密碼",
          });
        }
        // 驗證目前密碼
        const isValid = await bcrypt.compare(
          input.currentPassword,
          user.password || ""
        );
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "目前密碼不正確",
          });
        }
        // 加密新密碼
        updateData.password = await bcrypt.hash(input.newPassword, 10);
      }
      // 4️⃣ 執行更新
      const updated = await ctx.db.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
      return {
        success: true,
        message: input.email
          ? "Email 已更新"
          : "密碼已更新",
        user: updated,
      };
    }),
  // ==========================================
  // 🆕 用 Email 重置密碼（忘記密碼功能）
  // ==========================================
  resetPasswordByEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("請輸入有效的 Email"),
        newPassword: z.string().min(6, "新密碼至少 6 個字元"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1️⃣ 找尋該 Email 的使用者
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true, email: true, name: true },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "找不到此 Email 對應的員工帳號",
        });
      }
      // 2️⃣ 更新密碼
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      await ctx.db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      return {
        success: true,
        message: "密碼已重設，請使用新密碼登入",
      };
    }),


});