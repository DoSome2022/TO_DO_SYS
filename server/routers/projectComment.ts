import { z } from "zod";
import {  protectedProcedure, router } from "../trpc";

export const projectCommentRouter = router({
  getByProjectId: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const member = await ctx.db.projectMember.findFirst({
        where: {
          projectId: input.projectId,
          userId,
        },
      });

      if (!member) {
        throw new Error("Access denied");
      }

      const comments = await ctx.db.projectComment.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          sender: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return comments;
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        content: z.string().min(1).max(2000),
        type: z.enum(["TEXT", "SYSTEM", "FILE"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const member = await ctx.db.projectMember.findFirst({
        where: {
          projectId: input.projectId,
          userId,
        },
      });

      if (!member) {
        throw new Error("Access denied");
      }

      const comment = await ctx.db.projectComment.create({
        data: {
          projectId: input.projectId,
          senderId: userId,
          content: input.content,
          type: input.type ?? "TEXT",
        },
        include: {
          sender: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      return comment;
    }),
});
