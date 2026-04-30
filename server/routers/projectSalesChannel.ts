import { z } from "zod"
import { assertCanAccessSalesChannel, protectedProcedure, router } from "../trpc"
import { TRPCError } from "@trpc/server";   // ← 加上這行

export const projectSalesChannelRouter = router({

  // ─── 獲取頻道 ───
getChannel: protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const channel = await ctx.db.projectSalesChannel.findUnique({
      where: { projectId: input.projectId },
      include: {
        messages: {
          include: {
            sender: {          // ← 把 sender 整包帶出來
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return channel;
  }),

  // ─── 發送訊息 ───
  sendMessage: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      content: z.string().min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      // ✅ 在 handler 內部手動呼叫
      await assertCanAccessSalesChannel(ctx, input.projectId);

      const channel = await ctx.db.projectSalesChannel.upsert({
        where: { projectId: input.projectId },
        create: { projectId: input.projectId },
        update: {},
      });

      return ctx.db.projectSalesMessage.create({
        data: {
          channelId: channel.id,
          content: input.content,
          senderId: ctx.session.user.id,
        },
        include: {
          sender: { select: { id: true, name: true, image: true, role: true } }
        }
      });
    }),

  // ─── 頻道列表 ───
listMyChannels: protectedProcedure
  .query(async ({ ctx }) => {
    // Sales 只能看到自己負責的專案
    const projects = await ctx.db.project.findMany({
      where: {
        salesId: ctx.user.id,  // ← 關鍵：透過 salesId 關聯
      },
      include: {
        salesChannel: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: {
                  select: { id: true, name: true, role: true }
                }
              }
            },
            _count: {
              select: { 
                messages: {
                  where: {
                    senderId: { not: ctx.user.id },
                    readAt: null
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return projects.map(project => ({
      id: project.id,
      title: project.title,
      status: project.status,
      lastMessage: project.salesChannel?.messages[0] || null,
      unreadCount: project.salesChannel?._count?.messages || 0,
      hasChannel: !!project.salesChannel,
    }));
  }),


  // ─── 標記已讀 ───
  markAsRead: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ✅ 在 handler 內部手動呼叫
      await assertCanAccessSalesChannel(ctx, input.projectId);

      const channel = await ctx.db.projectSalesChannel.findUnique({
        where: { projectId: input.projectId }
      });
      if (!channel) return;

      await ctx.db.projectSalesMessage.updateMany({
        where: {
          channelId: channel.id,
          senderId: { not: ctx.session.user.id },
          readAt: null
        },
        data: { readAt: new Date() }
      });
    }),

    // 給 Admin 用的：取得所有 Sales 人員
getSalesUsers: protectedProcedure
  .query(async ({ ctx }) => {
    // 只有 Admin 可以調用
    const currentUser = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { role: true }
    });
    if (currentUser?.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    
    return await ctx.db.user.findMany({
      where: { 
        role: "SALES",
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { salesProjects: true }
        }
      },
      orderBy: { name: "asc" }
    });
  }),

// 給 Admin 用的：取得某個 Sales 負責的所有專案（含頻道摘要）
getProjectsBySales: protectedProcedure
  .input(z.object({ salesId: z.string() }))
  .query(async ({ ctx, input }) => {
    const currentUser = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { role: true }
    });
    if (currentUser?.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    
    // 查詢該 Sales 負責的所有專案
    const projects = await ctx.db.project.findMany({
      where: { salesId: input.salesId },
      include: {
        salesChannel: {  // ProjectSalesChannel
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,  // 只取最後一筆訊息作為預覽
              include: {
                sender: {
                  select: { id: true, name: true, role: true }
                }
              }
            },
            _count: {
              select: { 
                messages: {
                  where: {
                    senderId: { not: ctx.user.id },  // 不是 Admin 發的
                    readAt: null
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return projects.map(project => ({
      id: project.id,
      title: project.title, // 或 project.name
      status: project.status,
      lastMessage: project.salesChannel?.messages[0] || null,
      unreadCount: project.salesChannel?._count?.messages || 0,
      hasChannel: !!project.salesChannel,
    }));
  }),

});
