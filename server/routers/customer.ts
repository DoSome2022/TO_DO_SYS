
import { db } from "@/app/lib/prisma";
import { publicProcedure, router, 
    protectedProcedure 
} from "../trpc";
import z from "zod";
import bcrypt from "bcryptjs"; 


export const customerRouter = router({
  getCustomer: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const customer = await db.customer.findUnique({
        where: { id: input.id },
      });
      return customer;
    }),
  getAllCustomer: publicProcedure.query(async () => {
    const customers = await db.customer.findMany();
    return customers;
  }),
createCustomer: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string(), // 新增：接收前端傳來的密碼
        phone: z.string().optional(),
        customname: z.string().optional(),
        contactname: z.string().optional(),
        contactphone: z.string().optional(),
        companyname: z.string().optional(),
        companyaddress: z.string().optional(),
        companyemail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 使用前端傳來的密碼進行加密，而不是硬編碼 "123456"
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // 把 password 從 input 中分離出來，剩下的存入資料庫
      const { password, ...restData } = input;

      const customer = await db.customer.create({
        data: {
          ...restData,
          password: hashedPassword
        },
      });
      return customer;
    }),
    updateCustomer: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        customname: z.string().optional(),
        contactname: z.string().optional(),
        contactphone: z.string().optional(),
        companyname: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const customer = await db.customer.update({
        where: { id: input.id },
        data: input,
      });
      return customer;
    }),
 // 客戶提交合作申請表
    // 客戶提交合作申請表
 submitApplication: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(1, "請填寫公司名稱"),
        contactPhone: z.string().min(1, "請填寫聯絡電話"),
        requirements: z.string().min(1, "請填寫具體需求"),
        referenceProjectId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      const userId = session?.user?.id;
      const userRole = (session?.user as any)?.role;
      const customerId = (userId && userRole === "customer") ? userId : null;
      // ==========================================
      // 1. 自動派單邏輯：找出最閒的 Sales
      // ==========================================
      const salesReps = await db.user.findMany({
        where: { role: "SALES", isActive: true },
        include: {
          _count: {
            select: { SalesCustomerConversation: true } // 以負責的對話數量作為負載指標
          }
        }
      });
      if (salesReps.length === 0) {
        throw new Error("目前系統無可用的業務人員。");
      }
      // 找出對話數最少的 Sales
      const leastLoadedSales = salesReps.reduce((prev, curr) => 
        (curr._count.SalesCustomerConversation < prev._count.SalesCustomerConversation) ? curr : prev
      );
      // 2. 建立申請單
      const newRequest = await db.collaborationRequest.create({
        data: {
          companyName: input.companyName,
          contactPhone: input.contactPhone,
          requirements: input.requirements,
          referenceProjectId: input.referenceProjectId,
          customerId: customerId,
          // 如果 CollaborationRequest Schema 裡有 salesId，請取消下行註解：
          // salesId: leastLoadedSales.id, 
        },
      });
      // ==========================================
      // 3. 建立資訊孤島的橋樑：主動為 Sales 與客戶開通對話室
      // ==========================================
      if (customerId) {
        await db.salesCustomerConversation.create({
          data: {
            salesId: leastLoadedSales.id,
            customerId: customerId,
            content: `【系統提示】客戶剛送出了合作申請，請盡快與客戶聯繫！需求：${input.requirements}`,
            isRead: false, 
          }
        });
      }
      return { success: true, data: newRequest };
    }),

});