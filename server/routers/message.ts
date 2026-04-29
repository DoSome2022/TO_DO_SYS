// src/server/routers/message.ts

import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { db } from "@/app/lib/prisma";

export const messageRouter = router({
  // 1. 發送一般客服諮詢 (SalesCustomerConversation)
  sendGeneralMessage: publicProcedure
    .input(
      z.object({
        content: z.string().min(1),
        customerId: z.string(),
        salesId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let targetSalesId = input.salesId;

      if (!targetSalesId) {
        // 策略 1：找看看以前有沒有對話紀錄，抓最近一次對話的業務
        const lastConversation = await db.salesCustomerConversation.findFirst({
          where: { customerId: input.customerId },
          orderBy: { createdAt: "desc" },
        });

        if (lastConversation) {
          targetSalesId = lastConversation.salesId;
        } else {
          // 策略 2：如果沒有對話過，找看看有沒有為這個客戶開過報價單的業務
          const lastQuotation = await db.quotation.findFirst({
            where: { customerId: input.customerId },
            orderBy: { createdAt: "desc" },
          });

          if (lastQuotation) {
            targetSalesId = lastQuotation.salesId;
          } else {
            // 策略 3：如果真的是完全沒接觸過的全新客戶，才派發給 ADMIN
            const defaultAdmin = await db.user.findFirst({ where: { role: "ADMIN" } });
            targetSalesId = defaultAdmin?.id || "";
          }
        }
      }

      if (!targetSalesId) {
        throw new Error("無法找到可用的業務人員");
      }

      return db.salesCustomerConversation.create({
        data: {
          content: input.content,
          senderType: "CUSTOMER",
          customerId: input.customerId,
          salesId: targetSalesId,
        },
      });
    }),

  // 2. 發送專案/報價單專屬對話 (ExternalQuoteMessage)
  sendProjectMessage: publicProcedure
    .input(
      z.object({
        content: z.string().min(1),
        quotationId: z.string(),
        customerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return db.externalQuoteMessage.create({
        data: {
          content: input.content,
          quotationId: input.quotationId,
          senderCustomerId: input.customerId,
        },
      });
    }),

    // ✅ 3. 獲取版本對話訊息
  getVersionMessages: publicProcedure
    .input(
      z.object({
        versionId: z.string(),
        customerId: z.string(),
      })
    )
    .query(async ({ input }) => {
      // 驗證權限
      const version = await db.workVersion.findFirst({
        where: {
          id: input.versionId,
          project: {
            customerId: input.customerId,
          },
        },
      });

      if (!version) {
        throw new Error("找不到該版本或您無權限查看");
      }

      // 獲取該版本的所有對話訊息
      const messages = await db.versionMessage.findMany({
        where: { versionId: input.versionId },
        orderBy: { createdAt: "asc" },
      });

      // 收集需要查詢的 ID
      const userIds = messages.filter(m => m.userId).map(m => m.userId!);
      const customerIds = messages.filter(m => m.customerId).map(m => m.customerId!);

      // 批量查詢用戶和客戶資訊
      const [users, customers] = await Promise.all([
        db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, role: true },
        }),
        db.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true, companyname: true },
        }),
      ]);

      const userMap = new Map(users.map(u => [u.id, u]));
      const customerMap = new Map(customers.map(c => [c.id, c]));

      // 格式化訊息
      return messages.map((msg) => {
        let senderName = "";
        let senderRole = "";

        if (msg.senderType === "customer") {
          const customer = customerMap.get(msg.senderId);
          senderName = customer?.name || customer?.companyname || "客戶";
          senderRole = "customer";
        } else if (msg.senderType === "sales" || msg.senderType === "admin") {
          const user = userMap.get(msg.senderId);
          senderName = user?.name || "業務人員";
          senderRole = user?.role || "staff";
        } else {
          senderName = "系統";
          senderRole = "system";
        }

        return {
          id: msg.id,
          content: msg.content,
          senderType: msg.senderType,
          senderId: msg.senderId,
          senderName: senderName,
          senderRole: senderRole,
          createdAt: msg.createdAt,
          isCustomer: msg.senderType === "customer",
        };
      });
    }),

  // ==========================================
  // ✅ 3. 新增：發送版本對話訊息 (VersionMessage)
  // ==========================================
sendVersionMessage: publicProcedure
  .input(
    z.object({
      content: z.string().min(1),
      versionId: z.string(),
      customerId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    // 驗證這個版本是否屬於該客戶的專案
    const version = await db.workVersion.findFirst({
      where: {
        id: input.versionId,
        project: {
          customerId: input.customerId,
        },
      },
      include: {
        project: {
          select: {
            salesId: true,
            title: true,
          },
        },
      },
    });

    if (!version) {
      throw new Error("找不到該版本或您無權限對此版本發送訊息");
    }

    // 獲取客戶資訊用於回傳
    const customer = await db.customer.findUnique({
      where: { id: input.customerId },
      select: {
        name: true,
        companyname: true,
      },
    });

    // 創建版本對話訊息 - 修正：加入 senderId
    const message = await db.versionMessage.create({
      data: {
        content: input.content,
        versionId: input.versionId,
        senderType: "customer",
        senderId: input.customerId,  // ✅ 加入這個必填欄位
        customerId: input.customerId,
      },
    });

    // 回傳格式化的訊息（不需要 include，因為 customer 關聯需要另外查）
    return {
      id: message.id,
      content: message.content,
      senderType: message.senderType,
      senderId: message.senderId,
      senderName: customer?.name || customer?.companyname || "客戶",
      senderRole: "customer",
      createdAt: message.createdAt,
      isCustomer: true,
    };
  }),

  // ==========================================
  // ✅ 4. 新增：獲取版本對話訊息列表
  // ==========================================
getCustomerVersionConversations: publicProcedure
  .input(
    z.object({
      customerId: z.string(),
    })
  )
  .query(async ({ input }) => {
    // 先獲取客戶的所有專案 ID
    const customerProjects = await db.project.findMany({
      where: { customerId: input.customerId },
      select: { id: true },
    });

    const projectIds = customerProjects.map(p => p.id);

    if (projectIds.length === 0) {
      return [];
    }

    // 獲取所有該客戶專案下有對話記錄的版本
    const versionsWithMessages = await db.workVersion.findMany({
      where: {
        projectId: { in: projectIds },
        // 使用正確的關聯名稱（根據你的 Schema 是 messages）
        messages: {
          some: {}, // 有對話記錄的版本
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            salesId: true,
          },
        },
        phase: {
          select: {
            id: true,
            name: true,
          },
        },
        // 使用正確的關聯名稱
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // 收集所有需要查詢的用戶 ID 和客戶 ID
    const allMessages = await db.versionMessage.findMany({
      where: {
        versionId: { in: versionsWithMessages.map(v => v.id) },
      },
      orderBy: { createdAt: "desc" },
    });

    // 計算每個版本的未讀數量
    const unreadCounts: Record<string, number> = {};
    const latestMessages: Record<string, any> = {};

    for (const message of allMessages) {
      if (!latestMessages[message.versionId]) {
        latestMessages[message.versionId] = message;
      }
      if (message.senderType !== "customer") {
        unreadCounts[message.versionId] = (unreadCounts[message.versionId] || 0) + 1;
      }
    }

    // 批量獲取發送者資訊
    const userIds = [...new Set(allMessages.filter(m => m.userId).map(m => m.userId!))];
    const customerIds = [...new Set(allMessages.filter(m => m.customerId).map(m => m.customerId!))];

    const [users, customers] = await Promise.all([
      db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, role: true },
      }),
      db.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, companyname: true },
      }),
    ]);

    const userMap = new Map(users.map(u => [u.id, u]));
    const customerMap = new Map(customers.map(c => [c.id, c]));

    // 格式化結果
    return versionsWithMessages.map((version) => {
      const latestMessage = latestMessages[version.id];
      
      let senderName = "";
      if (latestMessage) {
        if (latestMessage.senderType === "customer") {
          const customer = customerMap.get(latestMessage.senderId);
          senderName = customer?.name || customer?.companyname || "客戶";
        } else if (latestMessage.userId) {
          const user = userMap.get(latestMessage.userId);
          senderName = user?.name || "業務人員";
        } else {
          senderName = "系統";
        }
      }

      return {
        versionId: version.id,
        versionName: version.versionName,
        versionNumber: version.versionNumber,
        reviewStatus: version.reviewStatus,
        projectId: version.project.id,
        projectTitle: version.project.title,
        phaseName: version.phase?.name || "未分類",
        latestMessage: latestMessage
          ? {
              content: latestMessage.content,
              senderName: senderName,
              senderType: latestMessage.senderType,
              createdAt: latestMessage.createdAt,
              isUnread: latestMessage.senderType !== "customer",
            }
          : null,
        unreadCount: unreadCounts[version.id] || 0,
      };
    });
  }),

  // ✅ 新增：審核通過版本
  approveVersion: publicProcedure
    .input(
      z.object({
        versionId: z.string(),
        customerId: z.string(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 驗證權限：確認該版本屬於該客戶的專案
      const version = await db.workVersion.findFirst({
        where: {
          id: input.versionId,
          project: {
            customerId: input.customerId,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              salesId: true,
            },
          },
        },
      });

      if (!version) {
        throw new Error("找不到該版本或您無權限審核");
      }

      // 更新版本狀態為已通過
      const updatedVersion = await db.workVersion.update({
        where: { id: input.versionId },
        data: {
          reviewStatus: "APPROVED",
          reviewComment: input.comment || null,
          reviewedAt: new Date(),
        },
      });

      // 發送系統通知訊息（可選）
      await db.versionMessage.create({
        data: {
          versionId: input.versionId,
          content: `✅ 【系統通知】客戶已通過版本「${version.versionName}」的審核${input.comment ? `，附言：${input.comment}` : ""}`,
          senderType: "system",
          senderId: "system",
          userId: version.project.salesId || undefined,
        },
      });

      return updatedVersion;
    }),

  // ✅ 新增：審核拒絕版本（需修改）
  rejectVersion: publicProcedure
    .input(
      z.object({
        versionId: z.string(),
        customerId: z.string(),
        comment: z.string().min(1, "請填寫修改意見"),
      })
    )
    .mutation(async ({ input }) => {
      // 驗證權限
      const version = await db.workVersion.findFirst({
        where: {
          id: input.versionId,
          project: {
            customerId: input.customerId,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              salesId: true,
            },
          },
        },
      });

      if (!version) {
        throw new Error("找不到該版本或您無權限審核");
      }

      // 更新版本狀態為需修改
      const updatedVersion = await db.workVersion.update({
        where: { id: input.versionId },
        data: {
          reviewStatus: "REJECTED",
          reviewComment: input.comment,
          reviewedAt: new Date(),
        },
      });

      // 發送系統通知訊息
      await db.versionMessage.create({
        data: {
          versionId: input.versionId,
          content: `❌ 【系統通知】客戶要求修改版本「${version.versionName}」\n修改意見：${input.comment}`,
          senderType: "system",
          senderId: "system",
          userId: version.project.salesId || undefined,
        },
      });

      return updatedVersion;
    }),

    // 審核通過交付成品
approveDeliverable: publicProcedure
  .input(z.object({
    deliverableId: z.string(),
    customerId: z.string(),
    projectId: z.string(),
  }))
  .mutation(async ({ input }) => {
    // 驗證權限
    const deliverable = await db.deliverable.findFirst({
      where: {
        id: input.deliverableId,
        phase: {
          project: {
            customerId: input.customerId,
          },
        },
      },
    });

    if (!deliverable) {
      throw new Error("找不到該交付成品或您無權限審核");
    }

    // 更新狀態
    return db.deliverable.update({
      where: { id: input.deliverableId },
      data: {
        reviewStatus: "APPROVED",
        reviewedAt: new Date(),
        customerId: input.customerId,
      },
    });
  }),

// 審核拒絕交付成品
rejectDeliverable: publicProcedure
  .input(z.object({
    deliverableId: z.string(),
    customerId: z.string(),
    projectId: z.string(),
    comment: z.string().min(1),
  }))
  .mutation(async ({ input }) => {
    const deliverable = await db.deliverable.findFirst({
      where: {
        id: input.deliverableId,
        phase: {
          project: {
            customerId: input.customerId,
          },
        },
      },
    });

    if (!deliverable) {
      throw new Error("找不到該交付成品或您無權限審核");
    }

    return db.deliverable.update({
      where: { id: input.deliverableId },
      data: {
        reviewStatus: "REJECTED",
        reviewComment: input.comment,
        reviewedAt: new Date(),
        customerId: input.customerId,
      },
    });
  }),

// 獲取交付成品的對話訊息
getDeliverableMessages: publicProcedure
  .input(
    z.object({
      deliverableId: z.string(),
      customerId: z.string(),
    })
  )
  .query(async ({ input }) => {
    // 驗證權限（客戶或 Sales）
    const deliverable = await db.deliverable.findFirst({
      where: {
        id: input.deliverableId,
        phase: {
          project: {
            OR: [
              { customerId: input.customerId },
              { salesId: input.customerId }, // 如果傳入的是 salesId
            ],
          },
        },
      },
    });

    if (!deliverable) {
      throw new Error("找不到該交付成品或您無權限查看");
    }

    const messages = await db.deliverableMessage.findMany({
      where: { deliverableId: input.deliverableId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        customer: {
          select: { id: true, name: true, companyname: true },
        },
      },
    });

    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderType: msg.senderType,
      senderId: msg.senderId,
      senderName: msg.user?.name || msg.customer?.name || msg.customer?.companyname || (msg.senderType === "customer" ? "客戶" : "業務"),
      senderRole: msg.user?.role || (msg.senderType === "customer" ? "customer" : "sales"),
      createdAt: msg.createdAt,
      isCustomer: msg.senderType === "customer",
    }));
  }),
// 發送交付成品的對話訊息
sendDeliverableMessage: publicProcedure
  .input(
    z.object({
      deliverableId: z.string(),
      content: z.string().min(1),
      senderType: z.enum(["customer", "sales", "admin"]),
      senderId: z.string(),
      customerId: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // 驗證權限
    const deliverable = await db.deliverable.findFirst({
      where: {
        id: input.deliverableId,
        phase: {
          project: {
            OR: [
              // 客戶權限驗證
              ...(input.senderType === "customer" ? [{ customerId: input.senderId }] : []),
              // Sales 權限驗證
              ...(input.senderType === "sales" ? [{ salesId: input.senderId }] : []),
            ],
          },
        },
      },
    });

    if (!deliverable) {
      throw new Error("找不到該交付成品或您無權限發送訊息");
    }

    // 準備建立訊息的資料
    const messageData: any = {
      deliverableId: input.deliverableId,
      content: input.content,
      senderType: input.senderType,
      senderId: input.senderId,
    };

    // 根據發送者類型設定對應的關聯 ID
    if (input.senderType === "customer") {
      messageData.customerId = input.senderId;
    } else if (input.senderType === "sales") {
      messageData.userId = input.senderId;
    }

    const message = await db.deliverableMessage.create({
      data: messageData,
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        customer: {
          select: { id: true, name: true, companyname: true },
        },
      },
    });

    // 返回格式化後的訊息
    return {
      id: message.id,
      content: message.content,
      senderType: message.senderType,
      senderId: message.senderId,
      senderName: message.user?.name || message.customer?.name || message.customer?.companyname || (message.senderType === "customer" ? "客戶" : "業務"),
      senderRole: message.user?.role || (message.senderType === "customer" ? "customer" : "sales"),
      createdAt: message.createdAt,
      isCustomer: message.senderType === "customer",
    };
  }),
  // Sales 發送一般客服訊息
sendGeneralMessageAsSales: publicProcedure
  .input(
    z.object({
      content: z.string().min(1),
      customerId: z.string(),
      salesId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    return db.salesCustomerConversation.create({
      data: {
        content: input.content,
        senderType: "SALES",
        customerId: input.customerId,
        salesId: input.salesId,
      },
    });
  }),

// Sales 發送專案報價單訊息
sendProjectMessageAsSales: publicProcedure
  .input(
    z.object({
      content: z.string().min(1),
      quotationId: z.string(),
      salesId: z.string(),
      customerId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    return db.externalQuoteMessage.create({
      data: {
        content: input.content,
        quotationId: input.quotationId,
        senderUserId: input.salesId,
      },
    });
  }),

});