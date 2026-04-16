// src/server/api/routers/companyProfile.ts
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../trpc";
import { ossClient } from "@/lib/oss";
// 👇 1. 引入你剛剛寫好的 OSS Client (請依照你的實際路徑調整)


export const companyProfileRouter = router({
  
  // ==========================================
  // 🌟 新增：專門用來上傳 Logo 到阿里雲 OSS 的 API
  // ==========================================
  uploadLogo: adminProcedure
    .input(
      z.object({
        filename: z.string(),
        base64Data: z.string(), // 接收前端轉好的 base64 字串
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 1. 移除 Base64 的前綴 (如 data:image/png;base64,)，並轉為 Buffer
        const base64Content = input.base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, "base64");

        // 2. 產生唯一檔名，存在 company-logos 資料夾下，避免檔名衝突
        const uniqueFilename = `company-logos/${Date.now()}-${input.filename}`;

        // 3. 執行 OSS 上傳
        const result = await ossClient.put(uniqueFilename, buffer);

        // 4. 回傳 OSS 上傳後的公開圖片網址
        return { url: result.url };
      } catch (error) {
        console.error("OSS Upload Error:", error);
        throw new Error("圖片上傳失敗，請檢查阿里雲設定");
      }
    }),

  // ==========================================
  // 👇 下面的程式碼維持原本的樣子，完全不用改！
  // ==========================================
  
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.companyProfile.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.companyProfile.findUnique({
        where: { id: input.id },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "公司名稱為必填"),
        logoUrl: z.string().url("必須是有效的網址").optional().or(z.literal("")),
        address: z.string().optional(),
        phone: z.string().optional(),
        taxId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.companyProfile.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "公司名稱為必填").optional(),
        logoUrl: z.string().url("必須是有效的網址").optional().or(z.literal("")),
        address: z.string().optional(),
        phone: z.string().optional(),
        taxId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.companyProfile.update({
        where: { id },
        data,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.companyProfile.delete({
        where: { id: input.id },
      });
    }),
});
