


// server/trpc.ts
import { db } from "@/app/lib/prisma";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/auth";
import type { DefaultSession } from "next-auth";

// =============================================
// 1. 擴展 NextAuth Session 型別
// =============================================
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// =============================================
// 2. Context 型別
// =============================================
export type TRPCContext = {
  db: typeof db;
  session: any;
  user: { id: string } | null;
  headers: Headers;
};

export const createTRPCContext = async (opts: { headers: Headers }): Promise<TRPCContext> => {
  const session = await auth();

  return {
    db,
    session,
    user: session?.user?.id ? { id: session.user.id as string } : null,
    headers: opts.headers,
  };
};

// =============================================
// 3. 初始化 tRPC
// =============================================
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// =============================================
// 4. 登入驗證 Middleware
// =============================================
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id || !ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "請先登入系統",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: { id: ctx.user.id },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const createCallerFactory = t.createCallerFactory;

// =============================================
// 5. 權限檢查 Middleware (基於 Permission Code)
// =============================================
export const hasPermission = (requiredCode: string) =>
  t.middleware(async ({ ctx, next }) => {
    const userId = ctx.user?.id;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "請先登入",
      });
    }

    const userWithPosition = await ctx.db.user.findUnique({
      where: { id: userId },
      include: {
        position: {
          include: {
            permissions: {
              select: { code: true },
            },
          },
        },
      },
    });

    const userPermCodes = userWithPosition?.position?.permissions.map((p) => p.code) ?? [];

    if (!userPermCodes.includes(requiredCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `權限不足：缺少 ${requiredCode} 權限`,
      });
    }

    return next();
  });

// =============================================
// 6. 職位檢查 Middleware (新增)
// =============================================

// 檢查是否為 Sales 職位
export const salesMiddleware = t.middleware(async ({ ctx, next }) => {
  const userId = ctx.user?.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "請先登入",
    });
  }

  const user = await ctx.db.user.findUnique({
    where: { id: userId },
    include: { position: true },
  });

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "用戶不存在" });
  }

  const positionName = user.position?.name?.toLowerCase() || "";
  const role = user.role?.toLowerCase() || "";
  
  const isSalesRole = positionName.includes("sales") || 
                      positionName.includes("業務") ||
                      role === "SALES";

  if (!isSalesRole) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "需要 Sales 權限才能執行此操作" 
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: { id: userId },
    },
  });
});

// 檢查是否為 Admin 職位
export const adminMiddleware = t.middleware(async ({ ctx, next }) => {
  const userId = ctx.user?.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "請先登入",
    });
  }

  const user = await ctx.db.user.findUnique({
    where: { id: userId },
    include: { position: true },
  });

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "用戶不存在" });
  }

  const positionName = user.position?.name?.toLowerCase() || "";
  const isAdminRole = positionName.includes("admin") || 
                      positionName.includes("管理員") ||
                      user.role === "ADMIN";

  if (!isAdminRole) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "需要 Admin 權限才能執行此操作" 
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: { id: userId },
    },
  });
});

// 檢查是否為 PM 職位
export const pmMiddleware = t.middleware(async ({ ctx, next }) => {
  const userId = ctx.user?.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "請先登入",
    });
  }

  const user = await ctx.db.user.findUnique({
    where: { id: userId },
    include: { position: true },
  });

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "用戶不存在" });
  }

  const positionName = user.position?.name?.toLowerCase() || "";
  const isPMRole = positionName.includes("pm") || 
                   positionName.includes("專案經理") ||
                   user.role === "PM";

  if (!isPMRole) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "需要 PM 權限才能執行此操作" 
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: { id: userId },
    },
  });
});

// =============================================
// 7. 導出各種 Procedure
// =============================================
export const salesProcedure = protectedProcedure.use(salesMiddleware);
export const adminProcedure = protectedProcedure.use(adminMiddleware);
export const pmProcedure = protectedProcedure.use(pmMiddleware);