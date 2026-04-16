// src/server/api/routers/adminUser.ts
import { z } from "zod";
import bcrypt from "bcryptjs"; 
import { publicProcedure, router } from "../trpc";

export const adminUserRouter = router({
  createAdmin: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().optional(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findUnique({
        where: { name: input.name },
      });

      if (existingUser) {
        throw new Error("此帳號名稱已被使用！");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      // ==========================================
      // 🌟 修正點：確保完全符合 adminMiddleware 的條件
      // ==========================================
      const newAdmin = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          
          // 1. role 必須是全大寫 "ADMIN"
          role: "ADMIN", 
          isActive: true,
          
          // 2. (可選但強烈建議) 直接連帶建立一個「系統管理員」的 Position
          // 因為你的 middleware 也有檢查 positionName.includes("管理員")
          position: {
            create: {
              name: "系統管理員",
              description: "系統最高權限擁有者"
            }
          }
        },
      });

      const { password, ...userWithoutPassword } = newAdmin;
      return userWithoutPassword;
    }),
});
