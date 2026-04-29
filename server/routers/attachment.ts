// server/routers/attachment.ts

import { z } from "zod";
import { protectedProcedure, router } from "../trpc";


export const attachmentRouter = router({
  // 1. 取得某個設備的所有附件
  getByEquipmentId: protectedProcedure
    .input(z.object({ equipmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.attachment.findMany({
        where: { equipmentId: input.equipmentId },
        orderBy: { createdAt: 'desc' },
      });
    }),

  // 2. 刪除附件 (只有上傳者或管理員能刪)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 先檢查是不是這個人上傳的 (簡單權限控管)
      const attachment = await ctx.db.attachment.findUnique({
        where: { id: input.id },
      });

      if (!attachment) throw new Error("附件不存在");
      
      // 這裡假設您希望只有上傳者可以刪除
      if (attachment.uploadedById !== ctx.session.user.id) {
         throw new Error("您沒有權限刪除此附件");
      }

      return ctx.db.attachment.delete({
        where: { id: input.id },
      });
    }),
});
