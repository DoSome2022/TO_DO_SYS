// server/routers/todo.ts
import { hasPermission, protectedProcedure, router } from "../trpc";
import { z } from "zod";

export const todoRouter = router({
  // ====================== PM TODO ======================
  getToDoAll_PM: protectedProcedure
    // .use(hasPermission("PM_TODO_VIEW"))   // 可自行調整權限 code
    .query(async ({ ctx }) => {
      return await ctx.db.pM_TODO.findMany({
        include: {
          staffTodos: {
            include: { staff: true, attachments: true }
          },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getToDoById_PM: protectedProcedure
    // .use(hasPermission("PM_TODO_VIEW"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.pM_TODO.findUnique({
        where: { id: input.id },
        include: {
          staffTodos: {
            include: { staff: true, attachments: true }
          },
          attachments: true,
        },
      });
    }),

  createToDo_PM: protectedProcedure
    // .use(hasPermission("PM_TODO_CREATE"))
    .input(z.object({
      title: z.string().min(1, "標題必填"),
      completed: z.boolean().default(false),
      Isconfirm: z.boolean().default(false),
      staff_name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.pM_TODO.create({
        data: {
          Title: input.title,
          completed: input.completed,
          Isconfirm: input.Isconfirm,
          staff_name: input.staff_name,
        },
      });
    }),

  updateToDo_PM: protectedProcedure
    // .use(hasPermission("PM_TODO_UPDATE")) // 假設的權限
    .input(z.object({
      id: z.string(),
      title: z.string().min(1, "標題必填"),
      completed: z.boolean().default(false),
      Isconfirm: z.boolean().default(false),
      staff_name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.pM_TODO.update({
        where: { id: input.id },
        data: {
          Title: input.title,
          completed: input.completed,
          Isconfirm: input.Isconfirm,
          staff_name: input.staff_name,
        },
      });
    }),
  deleteToDo_PM: protectedProcedure
    // .use(hasPermission("PM_TODO_DELETE")) // 假設的權限
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.pM_TODO.delete({
        where: { id: input.id },
      });
    }),

  // ====================== Staff TODO ======================
  getMyTasks: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.staff_TODO.findMany({
      where: { staff_id: ctx.user.id },   // 只能看到自己的任務
      include: {
        PM_TODO: true,
        attachments: true,
        staff: true,
      },
      orderBy: { targetDate: "asc" },
    });
  }),

  getToDoAll_Staff: protectedProcedure
    // .use(hasPermission("STAFF_TODO_VIEW"))
    .query(async ({ ctx }) => {
      return await ctx.db.staff_TODO.findMany({
        include: { PM_TODO: true, attachments: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  toggleStaffTodo: protectedProcedure
    .input(z.object({
      id: z.string(),
      completed: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 只能修改自己的任務
      return await ctx.db.staff_TODO.update({
        where: { 
          id: input.id,
          staff_id: ctx.user.id 
        },
        data: { completed: input.completed },
      });
    }),

  createToDo_Staff: protectedProcedure
    // .use(hasPermission("STAFF_TODO_CREATE"))
    .input(z.object({
      title: z.string().min(1),
      completed: z.boolean().default(false),
      targetDate: z.string().optional(),   // 可改成 z.coerce.date()
      PM_TODO_id: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.staff_TODO.create({
        data: {
          Title: input.title,
          completed: input.completed,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
          staff_id: ctx.user.id,                    // 自動綁定自己
          PM_TODO_id: input.PM_TODO_id,
        },
      });
    }),

      updateToDo_Staff: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1, "標題必填"),
      targetDate: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.staff_TODO.update({
        where: { 
          id: input.id,
          staff_id: ctx.user.id // 🔒 只能改自己的
        },
        data: {
          Title: input.title,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
        },
      });
    }),

  deleteToDo_Staff: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.staff_TODO.delete({
        where: { 
          id: input.id,
          staff_id: ctx.user.id // 🔒 只能刪自己的
        },
      });
    }),

});