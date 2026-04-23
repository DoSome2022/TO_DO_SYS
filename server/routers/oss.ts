// server/routers/oss.ts
import { protectedProcedure, router } from "../trpc";
import { z } from "zod";
import OSS from "ali-oss";

export const OssRouter = router({
  // 🌟 免 ARN！直接產生單次上傳專用的預簽名網址
  getPresignedUrl: protectedProcedure
    .input(z.object({
      fileName: z.string(), // 前端告訴後端要傳的檔名
      contentType: z.string(), // 檔案類型
    }))
    .mutation(async ({ input }) => {
      // 直接用您 .env 裡面的主 Key 初始化 (不需要 STS)
      const client = new OSS({
        region: process.env.ALI_OSS_REGION!,
        accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID!,
        accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET!,
        bucket: process.env.ALI_OSS_BUCKET!,
        secure: process.env.ALI_OSS_SECURE === "true",
      });

      // 產生唯一檔名
      const uniqueFileName = `project-versions/${crypto.randomUUID()}-${input.fileName}`;

      // 產生一小時效期的 PUT 專用上傳網址
      const uploadUrl = client.signatureUrl(uniqueFileName, {
        method: "PUT",
        expires: 3600,
        "Content-Type": input.contentType,
      });

      // 回傳給前端「上傳用的網址」以及「未來讀取用的公開網址」
      const publicUrl = `https://${process.env.ALI_OSS_BUCKET}.${process.env.ALI_OSS_REGION}.aliyuncs.com/${uniqueFileName}`;

      return {
        uploadUrl,
        publicUrl,
      };
    }),
});
