// server/routers/customer.ts
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
    
  getAllCustomer: publicProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const where: any = {};
      if (input?.search) {
        const keyword = input.search;
        where.OR = [
          { name: { contains: keyword, mode: "insensitive" } },
          { companyname: { contains: keyword, mode: "insensitive" } },
          { email: { contains: keyword, mode: "insensitive" } },
          { phone: { contains: keyword, mode: "insensitive" } },
          { contactname: { contains: keyword, mode: "insensitive" } },
          { companyaddress: { contains: keyword, mode: "insensitive" } },
        ];
      }
      const customers = await db.customer.findMany({ where });
      return customers;
    }),
  
  createCustomer: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string(),
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
      const hashedPassword = await bcrypt.hash(input.password, 10);
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
        companyaddress: z.string().optional(),
        companyemail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const customer = await db.customer.update({
        where: { id: input.id },
        data: input,
      });
      return customer;
    }),
     // ==========================================
  // ✅ 新增：獲取客戶資訊（包含最新的報價單）
  // ==========================================
  getCustomerInfo: publicProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      const customer = await db.customer.findUnique({
        where: { id: input.customerId },
        select: {
          id: true,
          name: true,
          companyname: true,
          email: true,
          phone: true,
          contactname: true,
          contactphone: true,
          companyemail: true,
          // 獲取最新的報價單（按建立時間排序，取第一筆）
          quotations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
              customerPrice: true,
            }
          },
          // 也可以取得成交的專案數量
          _count: {
            select: {
              Project: {
                where: { status: "COMPLETED" } // 根據你的專案狀態調整
              }
            }
          }
        }
      });
      
      return customer;
    }),
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
      
      const salesReps = await db.user.findMany({
        where: { role: "SALES", isActive: true },
        include: {
          _count: {
            select: { SalesCustomerConversation: true }
          }
        }
      });
      
      if (salesReps.length === 0) {
        throw new Error("目前系統無可用的業務人員。");
      }
      
      const leastLoadedSales = salesReps.reduce((prev, curr) => 
        (curr._count.SalesCustomerConversation < prev._count.SalesCustomerConversation) ? curr : prev
      );
      
      const newRequest = await db.collaborationRequest.create({
        data: {
          companyName: input.companyName,
          contactPhone: input.contactPhone,
          requirements: input.requirements,
          referenceProjectId: input.referenceProjectId,
          customerId: customerId,
        },
      });
      
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

  // ==========================================
  // 新增：根據 customerId 獲取所有相關的專案及其版本
  // ==========================================
  // server/routers/customer.ts
getCustomerProjectsWithVersions: publicProcedure
  .input(z.object({ 
    customerId: z.string(),
  }))
  .query(async ({ input }) => {
    const { customerId } = input;
    
    const projects = await db.project.findMany({
      where: { 
        customerId: customerId,
      },
      include: {
        phases: {
          include: {
            selectedVersions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            },
            deliverables: {  // ✅ 新增：加入 deliverables
              select: {
                id: true,
                name: true,
                url: true,
                fileKey: true,
                fileSize: true,
                createdAt: true,
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        customer: {
          select: {
            id: true,
            name: true,
            companyname: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const quotations = await db.quotation.findMany({
      where: { 
        customerId: customerId,
        status: "WON",
        projectId: null
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      }
    });

    return {
      projects,
      quotations,
    };
  }),
});