// server/trpc.ts
import { db } from "@/app/lib/prisma";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/auth";
import type { DefaultSession } from "next-auth";

// =============================================
// 1. 擴展 NextAuth Session 型別
// =============================================
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       role?: string;
//     } & DefaultSession["user"];
//   }
// }

// =============================================
// 2. 定義統一的 Context User 類型
// =============================================
export type ContextUser = {
  id: string;
  role?: string;
  positionName?: string;
} | null;

export type TRPCContext = {
  db: typeof db;
  session: any;
  user: ContextUser;
  headers: Headers;
};

// =============================================
// 3. Context 建立函數
// =============================================
export const createTRPCContext = async (opts: { headers: Headers }): Promise<TRPCContext> => {
  const session = await auth();

  // 獲取用戶的完整資訊（包含 role 和 position）
  let userInfo = null;
  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { position: true },
    });
    
    if (user) {
      userInfo = {
        id: user.id,
        role: user.role,
        positionName: user.position?.name,
      };
    }
  }

  return {
    db,
    session,
    user: userInfo,
    headers: opts.headers,
  };
};

// =============================================
// 4. 初始化 tRPC
// =============================================
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// =============================================
// 5. 登入驗證 Middleware
// =============================================
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "請先登入系統",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // 保持類型一致
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const createCallerFactory = t.createCallerFactory;

// =============================================
// 6. 權限檢查 Middleware
// =============================================
export const hasPermission = (requiredCode: string) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "請先登入",
      });
    }

    const userWithPosition = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
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
// 7. 職位檢查 Middleware
// =============================================

// 檢查是否為 Sales 職位
export const salesMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "請先登入",
    });
  }

  // 重新獲取最新的用戶資訊（確保權限檢查是最新的）
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.user.id },
    include: { position: true },
  });

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "用戶不存在" });
  }

  const positionName = user.position?.name?.toLowerCase() || "";
  const role = user.role?.toLowerCase() || "";
  
  const isSalesRole = positionName.includes("sales") || 
                      positionName.includes("業務") ||
                      role === "sales" ||
                      role === "SALES";

  if (!isSalesRole) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "需要 Sales 權限才能執行此操作" 
    });
  }

  // 返回更新的用戶資訊
  return next({
    ctx: {
      ...ctx,
      user: {
        id: user.id,
        role: user.role,
        positionName: user.position?.name,
      },
    },
  });
});

// 檢查是否為 Admin 職位
export const adminMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "請先登入",
    });
  }

  const user = await ctx.db.user.findUnique({
    where: { id: ctx.user.id },
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
      user: {
        id: user.id,
        role: user.role,
        positionName: user.position?.name,
      },
    },
  });
});

// 檢查是否為 PM 職位
export const pmMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "請先登入",
    });
  }

  const user = await ctx.db.user.findUnique({
    where: { id: ctx.user.id },
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
      user: {
        id: user.id,
        role: user.role,
        positionName: user.position?.name,
      },
    },
  });
});

// =============================================
// 8. 導出各種 Procedure
// =============================================
export const salesProcedure = protectedProcedure.use(salesMiddleware);
export const adminProcedure = protectedProcedure.use(adminMiddleware);
export const pmProcedure = protectedProcedure.use(pmMiddleware);

// =============================================
// ⭐ 9. 新增：Sales Channel 存取檢查函式
//     (在 router 的 query/mutation 內呼叫)
// =============================================
/**
 * 檢查當前用戶是否有權存取該專案的 Admin-Sales 內部頻道
 * 
 * 規則：
 * - Admin：可以看所有專案的頻道
 * - Sales：只能看自己跟進的專案頻道
 * - 其他人：一律禁止
 * 
 * @throws TRPCError UNAUTHORIZED / FORBIDDEN
 */
export async function assertCanAccessSalesChannel(
  ctx: {
    db: typeof db;
    user: ContextUser;
  },
  projectId: string
): Promise<void> {
  // 1. 確認登入
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "請先登入系統",
    });
  }

  const userId = ctx.user.id;
  const userRole = ctx.user.role;

  // 2. Admin 可以看全部
  if (userRole === "ADMIN") {
    return;
  }

  // 3. 檢查用戶是不是該專案的 Sales
  const project = await ctx.db.project.findUnique({
    where: { id: projectId },
    select: { 
      salesId: true,
      sales: {
        select: { id: true, name: true }
      }
    },
  });

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "專案不存在",
    });
  }

  // 4. Sales 只能看自己的專案
  if (project.salesId === userId) {
    return;
  }

  // 5. 其他情況一律拒絕
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "你沒有權限存取此專案的內部對話",
  });
}
