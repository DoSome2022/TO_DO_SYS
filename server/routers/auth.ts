// server/routers/auth.ts
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import nodemailer from "nodemailer";
import { TRPCError } from "@trpc/server";


export const authRouter = router({
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { email } = input;

      // 建立 Gmail transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      // 實際應從資料庫產生唯一 token 並儲存，此處僅為示範
      const resetLink = `https://yourdomain.com/auth/reset-password?email=${encodeURIComponent(email)}`;

      try {
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: email,
          subject: "重設您的密碼",
          html: `
            <h2>重設密碼</h2>
            <p>請點擊以下連結重設您的密碼：</p>
            <a href="${resetLink}" style="padding:10px 20px; background:#d97706; color:white; text-decoration:none; border-radius:5px;">
              重設密碼
            </a>
            <p>如果此連結無法點擊，請複製貼上到瀏覽器：<br/>${resetLink}</p>
            <p>如果您沒有要求重設密碼，請忽略此信件。</p>
          `,
        });
        // 為安全起見，不應回傳失敗細節
        return { success: true };
      } catch (error) {
        console.error("寄信失敗:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "寄信失敗，請稍後再試",
        });
      }
    }),
});
