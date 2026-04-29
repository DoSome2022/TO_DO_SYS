import { db } from "@/app/lib/prisma";
import { publicProcedure, router } from "../trpc";
import z from "zod";


export const phaseRouter = router({

    getPhase: publicProcedure
        .query(async () => {
            const phases = await db.projectPhase.findMany();
            return phases;
        }),
    
    getPhaseById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const phase = await db.projectPhase.findUnique({
                where: { id: input.id },
            });
            return phase;
        }),
            // ★ 新增這支 API：透過 projectId 找出該專案所有的 Phase
getPhasesByProjectId: publicProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ input }) => {
    const phases = await db.projectPhase.findMany({
      where: { projectId: input.projectId },
      orderBy: { order: 'asc' },
      include: {
        selectedVersions: {
          include: {
            user: {
              select: { id: true, name: true }
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
      }
    });
    return phases;
  }),
    createPhase: publicProcedure
        .input(z.object({
            projectId: z.string(), // ★ 必填：必須知道是建立在哪個專案底下
            name: z.string(),
            description: z.string().optional(),
            startDate: z.coerce.date().optional(), // 允許建立時順便押時間
            endDate: z.coerce.date().optional(),
            }))
        .mutation(async ({ input }) => {
                    // (選擇性) 找出目前該專案有幾個階段，自動計算下一個排序 (order)
        const existingPhasesCount = await db.projectPhase.count({
            where: { projectId: input.projectId }
        });
            const newPhase = await db.projectPhase.create({
                data: {
                projectId: input.projectId, // ★ 補上
                name: input.name,
                description: input.description,
                startDate: input.startDate,
                endDate: input.endDate,
                order: existingPhasesCount, // 新階段排在最後面
                },
            });
            return newPhase;
        }),
    updatePhase: publicProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            status: z.string().optional(), // ★ 讓 PM 可以改狀態
            order: z.number().int().optional(), // ★ 允許調整順序
            startDate: z.coerce.date().nullable().optional(), 
            endDate: z.coerce.date().nullable().optional(),
            }))
        .mutation(async ({ input }) => {
            const { id, ...updateData } = input;

                // ★ 貼心邏輯：如果 PM 把狀態改成 COMPLETED，自動押上完成時間
                let completedAt = undefined;
                if (updateData.status === "COMPLETED") {
                    completedAt = new Date();
                } else if (updateData.status && updateData.status !== "COMPLETED") {
                    completedAt = null; // 如果退回 IN_PROGRESS，就把完成時間清空
                }
            const updatedPhase = await db.projectPhase.update({
                    where: {
                        id: input.id,
                    },
                    data: {
                        ...updateData,
                        completedAt: completedAt !== undefined ? completedAt : undefined,
                    }
                })
            return updatedPhase;
        }),
        assignVersionToPhase: publicProcedure
        .input(z.object({
            versionId: z.string(),
            phaseId: z.string(),
        }))
        .mutation(async ({ input }) => {
            const updatedVersion = await db.workVersion.update({
                where: { id: input.versionId },
                data: {
                    phaseId: input.phaseId,           // 關鍵：關聯到階段
                },
                include: {
                    user: true,
                    phase: true
                }
            });

            return updatedVersion;
        }),

 // 獲取某個版本的所有對話
getVersionMessages: publicProcedure
  .input(z.object({ 
    versionId: z.string(),
  }))
  .query(async ({ input }) => {
    const messages = await db.versionMessage.findMany({
      where: { versionId: input.versionId },
      include: {
        user: {           // 注意：是 user，不是 senderUser
          select: { id: true, name: true, role: true }
        },
        customer: {       // 注意：是 customer，不是 senderCustomer
          select: { id: true, name: true, companyname: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // 轉換成前端好用的格式
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
      senderType: msg.userId ? 'internal' : 'customer',  // 用 userId 判斷
      sender: msg.userId ? msg.user : msg.customer,
      senderName: msg.userId 
        ? msg.user?.name 
        : msg.customer?.name || msg.customer?.companyname,
    }));
    
    return formattedMessages;
  }),

// 發送版本對話
sendVersionMessage: publicProcedure
  .input(z.object({
    versionId: z.string(),
    content: z.string().min(1),
    senderType: z.enum(['customer', 'sales', 'admin']),
    senderId: z.string(),
  }))
  .mutation(async ({ input }) => {
    // 根據 senderType 決定要填哪個欄位
    const isCustomer = input.senderType === 'customer';
    
    const message = await db.versionMessage.create({
      data: {
        versionId: input.versionId,
        content: input.content,
        senderType: input.senderType,
        senderId: input.senderId,
        // 根據類型填入對應的關聯 ID
        ...(isCustomer 
          ? { customerId: input.senderId }
          : { userId: input.senderId }
        ),
      },
      include: {
        user: {           // 注意：是 user
          select: { id: true, name: true, role: true }
        },
        customer: {       // 注意：是 customer
          select: { id: true, name: true, companyname: true }
        }
      }
    });
    
    // 回傳格式化的訊息
    return {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      senderType: message.userId ? 'internal' : 'customer',
      sender: message.userId ? message.user : message.customer,
      senderName: message.userId 
        ? message.user?.name 
        : message.customer?.name || message.customer?.companyname,
    };
  }),
  

})