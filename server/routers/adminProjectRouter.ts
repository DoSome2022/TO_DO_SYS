import { z } from "zod";
import { adminProcedure, router } from "../trpc";

export const adminProjectRouter = router({
  
  // 建立專案並連帶產生報價單
  createProjectWithQuotation: adminProcedure
    .input(
      z.object({
        // 專案與客戶資訊
        title: z.string().min(1, "專案名稱必填"),
        description: z.string().optional(),
        customerId: z.string().min(1, "請選擇客戶"),
        
        // 報價單專屬設定
        companyProfileId: z.string().min(1, "請選擇發出報價單的公司/Logo抬頭"),
        
        // 報價單的收費項目列表 (服務項目)
        services: z.array(
          z.object({
            serviceId: z.string(), 
            customName: z.string().optional(),
            quantity: z.number().min(1),
            unitPrice: z.number().min(0),
          })
        ).min(1, "報價單至少需要一個服務項目"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. 計算列表的總價 (totalAmount)
      const totalAmount = input.services.reduce(
        (acc, item) => acc + item.quantity * item.unitPrice, 
        0
      );

      // 2. 啟動 Prisma Transaction，確保資料一致性
      const result = await ctx.db.$transaction(async (tx) => {
        
        // A. 先建立 Project
        const newProject = await tx.project.create({
          data: {
            title: input.title,
            description: input.description,
            status: "IN_PROGRESS", // 假設你的 Project 有這個狀態
          },
        });

        // B. 建立 Quotation 並將剛剛算好的總價與關聯帶入
        const newQuotation = await tx.quotation.create({
          data: {
            title: `${input.title} - 報價單`,
            totalAmount: totalAmount,
            // 拔除 creatorName，改用你 schema 原本就有的 salesId 來紀錄建立者(業務/管理員)
            salesId: ctx.session.user.id, 
            companyProfileId: input.companyProfileId,
            customerId: input.customerId,
            projectId: newProject.id, 
            
            // C. 透過嵌套建立 (Nested Create) 直接建立明細列表 QuotationItem
            items: {
              create: input.services.map((item) => ({
                serviceId: item.serviceId,
                customName: item.customName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.quantity * item.unitPrice,
              })),
            },
          },
          // 將包含進來的資料一起回傳，前端就可以直接拿到「建立者的名字(sales.name)」跟「公司Logo」
          include: {
            items: {
              include: { service: true }
            },
            companyProfile: true,
            customer: true,
            sales: true, // 👈 這樣前端回傳的資料就會有 ctx.session.user 的詳細資料(包含名字)
          }
        });

        return { project: newProject, quotation: newQuotation };
      });

      return result;
    }),
});
