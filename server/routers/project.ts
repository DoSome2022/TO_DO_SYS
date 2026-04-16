

// server/routers/project.ts
import { db } from "@/app/lib/prisma";
import { protectedProcedure, router ,hasPermission, publicProcedure } from "../trpc"; // ← 改用 protectedProcedure
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// 假設您已有權限 middleware（後面會說明如何建立）


export const ProjectRouter = router({
  // ====================== 查詢 ======================
  getProjectAll: protectedProcedure
    .query(async ({ ctx }) => {
      const projects = await db.project.findMany({
        include: {
          sales: { select: { id: true, name: true, position: true } },
          pm: { select: { id: true, name: true, position: true } },
          customer: { select: { id: true, name: true } },
          workItems: { select: { isCompleted: true } },
          phases: { select: { id: true, status: true, order: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      return projects.map((p) => {
        const total = p.workItems.length;
        const completed = p.workItems.filter((w) => w.isCompleted).length;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        return {
          ...p,
          progress,
          totalTasks: total,
          completedTasks: completed,
        };
      });
    }),

 getProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.project.findUnique({
        where: { id: input.id },
        include: {
          sales: true,
          pm: true,
          customer: true,
          
          // 👇 就是少了這一段！必須明確告訴 Prisma 把 quotation 以及它的 items 撈出來
          quotation: {
            include: {
              items: {
                include: {
                  service: true // 順便把報價單裡面的服務項目(Service)詳細資料也撈出來
                }
              }
            }
          },
          // 👆 加入上面這段
          
          phases: {
            orderBy: { order: "asc" },
            include: {
              selectedVersions: { include: { user: true } },
              workItems: { include: { staff: true } },
              deliverables: true, // 如果您之前上傳 OSS 的檔案要顯示，記得 include 這個
            },
          },
          allVersions: {
            include: { user: true },
            orderBy: { createdAt: "desc" },
          },
          workItems: { include: { staff: true } },
          users: true,
        },
      });
    }),


  // ====================== 建立專案（重點） ======================
  createProject: protectedProcedure
    // .use(hasPermission("PROJECT_CREATE")) // ← 只有擁有此權限者才能建立
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["IN_PROGRESS", "COMPLETED", "ON_HOLD"]).optional().default("IN_PROGRESS"),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
        customerId: z.string().optional(),
        quotationId: z.string().optional(),
        pmId: z.string().optional(), // Sales 指定 PM
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. 自動設定 Sales 為目前登入使用者
      const salesId = ctx.session.user.id;

      const project = await db.project.create({
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          startDate: input.startDate,
          endDate: input.endDate,
          customerId: input.customerId,
          quotationId: input.quotationId,
          salesId,           // ← 自動填入 Sales
          pmId: input.pmId,  // ← Sales 可指定 PM（可為 null）
        },
      });

      // 2. 若來自報價單，更新狀態
      if (input.quotationId) {
        await db.quotation.update({
          where: { id: input.quotationId },
          data: { status: "WON" },
        });
      }

      return project;
    }),

  // ====================== 更新與人員指派 ======================
  updateProject: protectedProcedure
    // .use(hasPermission("PROJECT_UPDATE"))
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["IN_PROGRESS", "COMPLETED", "ON_HOLD"]).optional(),
        startDate: z.coerce.date().nullable().optional(),
        endDate: z.coerce.date().nullable().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        pmId: z.string().nullable().optional(), // 允許 Sales 後續更改 PM
        // 👇 必須加上這行，才能接收到前端的上架/下架指令
        isPublicPortfolio: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.project.update({ where: { id }, data });
    }),

  assignUserToProject: protectedProcedure
    // .use(hasPermission("PROJECT_ASSIGN_USER"))
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      return await db.project.update({
        where: { id: input.projectId },
        data: { users: { connect: { id: input.userId } } },
      });
    }),

  removeUserFromProject: protectedProcedure
    // .use(hasPermission("PROJECT_ASSIGN_USER"))
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      return await db.project.update({
        where: { id: input.projectId },
        data: { users: { disconnect: { id: input.userId } } },
      });
    }),


  // ====================== 取得可指派的 PM 清單 ======================
  getPMCandidates: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      where: {
        isActive: true,
        // 👇 改為直接搜尋 User 表的 role 欄位
        OR: [
          { role: { contains: "pm", mode: "insensitive" } },
          { role: { contains: "專案經理" } },
          { role: { equals: "PM" } } // 確保精準匹配 PM
        ]
      },
      select: {
        id: true,
        name: true,
        role: true, // 可以把 role 傳下去，幫助確認
        position: {
          select: { 
            name: true 
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }),


   // ====================== 取得公開作品與其歷史報價 ======================
  getProjectWithQuote: publicProcedure 
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await db.project.findUnique({
        where: { id: input.projectId },
        select: {
          id: true,
          title: true, 
          // 因為是一對一關聯，這裡直接選取 quotation
          quotation: { 
            select: { 
              status: true,
              customerPrice: true // 使用 Schema 中的 customerPrice 欄位
            } 
          }
        }
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "找不到該參考作品",
        });
      }

      // 如果報價單不是 WON (贏單)，我們可以選擇不把金額傳給前端，避免洩漏未成交的機密
      if (project.quotation?.status !== "WON") {
        project.quotation = null;
      }

      return project;
    }),
    
  getSalesProjects: protectedProcedure.query(async ({ ctx }) => {
    // 1. 取得目前登入的業務 ID
    const salesId = ctx.session.user.id;
    // 2. 查詢該業務負責的專案
    const projects = await db.project.findMany({
      where: {
        salesId: salesId, // 🔴 核心邏輯：只篩選 salesId 等於自己的專案
      },
      include: {
        customer: { select: { name: true } },
        pm: { select: { name: true } },
        quotation: { select: { id: true, status: true } }, // 順便抓取報價單資訊
        phases: { 
          select: { id: true, status: true },
          orderBy: { order: "asc" } 
        }, 
      },
      orderBy: { updatedAt: "desc" },
    });
    return projects;
  }),
  // 👇 新增這支 API：同時建立報價單與專案
   // 👇 同時建立報價單與專案
  // server/routers/project.ts

  // 👇 同時建立報價單與專案
  createProjectWithQuote: protectedProcedure
    .input(
      // ★ 這裡的 Zod Schema 定義了 input 的型別，這樣 TypeScript 就不會報錯了
      z.object({
        title: z.string(),
        description: z.string().optional(),
        pmId: z.string().optional(),
        customerId: z.string(),
        companyProfileId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        services: z.array(
          z.object({
            serviceId: z.string(),
            customName: z.string().optional(),
            quantity: z.number(),
            unitPrice: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. 取得目前登入的業務 ID
      const salesId = ctx.session.user.id;
      
      // 2. 計算報價單總金額 (因為上面定義了 services，這裡 item 就不會是 any 了)
      const totalPrice = input.services.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      
      // 3. 使用 Prisma Transaction
      const result = await db.$transaction(async (tx) => {
        
        // A. 建立報價單
        const quotation = await tx.quotation.create({
          data: {
            title: input.title,
            salesId: salesId,
            customerId: input.customerId,
            companyProfileId: input.companyProfileId,
            status: "DRAFT", 
            customerPrice: totalPrice, 
            items: {
              create: input.services.map((s) => ({
                serviceId: s.serviceId,
                customName: s.customName,
                quantity: s.quantity,
                unitPrice: s.unitPrice,
                subtotal: s.quantity * s.unitPrice,
              })),
            },
          },
        });
        
        // B. 建立專案並使用 connect 正確綁定關聯
        const project = await tx.project.create({
          data: {
            title: input.title,
            description: input.description,
            salesId: salesId,
            customerId: input.customerId,
            pmId: input.pmId || null,
            status: "IN_PROGRESS",
            startDate: input.startDate ? new Date(input.startDate) : null,
            endDate: input.endDate ? new Date(input.endDate) : null,
            // ✅ 使用 connect 正確建立與剛剛 Quotation 的雙向關聯
            quotation: {
              connect: {
                id: quotation.id
              }
            }
          },
        });

        return { project, quotation };
      });
      
      return result;
    }),


 // 1. 新增專案任務 (對應到 DB 的 WorkItem)
  addProjectTask: protectedProcedure
    .input(z.object({ 
      projectId: z.string(), 
      title: z.string().min(1) 
    }))
    .mutation(async ({ input }) => {
      return await db.workItem.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          isCompleted: false,
        },
      });
    }),
  // 2. 指派專案任務給員工
  assignProjectTask: protectedProcedure
    .input(z.object({ 
      workItemId: z.string(), 
      staffId: z.string().nullable() // 允許為空 (解除指派)
    }))
    .mutation(async ({ input }) => {
      return await db.workItem.update({
        where: { id: input.workItemId },
        data: { staffId: input.staffId }, // 對應到 Prisma 的 staffId
      });
    }),

});