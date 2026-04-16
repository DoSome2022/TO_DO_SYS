// server/middlewares/hasPermission.ts
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../trpc";
import { db } from "@/app/lib/prisma";

export const hasPermission = (requiredCode: string) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // 查詢該使用者的 Position 擁有的所有 Permission code
    const userWithPerms = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        position: {
          include: { permissions: { select: { code: true } } },
        },
      },
    });

    const userPermCodes = userWithPerms?.position?.permissions.map((p) => p.code) ?? [];

    if (!userPermCodes.includes(requiredCode)) {
      throw new TRPCError({ code: "FORBIDDEN", message: `缺少權限: ${requiredCode}` });
    }

    return next();
  });