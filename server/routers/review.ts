// 在 phaseRouter 中新增或獨立新增一個 reviewRouter

import { db } from "@/app/lib/prisma";
import { publicProcedure, router } from "../trpc";
import z from "zod";

// 在您的 reviewRouter 中修改 getCustomerProjectVersions
// server/routers/review.ts 或您存放 review router 的地方

export const reviewRouter = router({
  getCustomerProjectVersions: publicProcedure
    .input(z.object({
      projectId: z.string(),
      customerId: z.string(),
    }))
    .query(async ({ input }) => {
      const project = await db.project.findFirst({
        where: {
          id: input.projectId,
          customerId: input.customerId,
        },
        include: {
          phases: {
            orderBy: { order: 'asc' },
            include: {
              selectedVersions: {  // ← 確保這裡有 include selectedVersions
                orderBy: { createdAt: 'desc' },
                include: {
                  user: {
                    select: { name: true }
                  }
                }
              },
              deliverables: {  // ← 確保有 include deliverables
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      });

      if (!project) {
        throw new Error("專案不存在或無權限訪問");
      }

      return project;
    }),


  // 客戶提交審核意見
  submitVersionReview: publicProcedure
    .input(z.object({
      versionId: z.string(),
      reviewStatus: z.enum(['APPROVED', 'REJECTED']),
      reviewComment: z.string().optional(),
      customerId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // 驗證該版本是否屬於該客戶的專案
      const version = await db.workVersion.findFirst({
        where: {
          id: input.versionId,
          project: {
            customerId: input.customerId,
          }
        },
        include: {
          project: true
        }
      });

      if (!version) {
        throw new Error("版本不存在或無權限審核");
      }

      // 更新版本審核狀態
      const updatedVersion = await db.workVersion.update({
        where: { id: input.versionId },
        data: {
          reviewStatus: input.reviewStatus,
          reviewComment: input.reviewComment,
          reviewedAt: new Date(),
        }
      });

      // 如果是駁回，自動創建一個"修改任務"給員工（可選）
      if (input.reviewStatus === 'REJECTED') {
        await db.workItem.create({
          data: {
            title: `修改版本：${version.versionName} - ${input.reviewComment || "客戶要求修改，請查看審核意見"}`,
            projectId: version.projectId,
            phaseId: version.phaseId,
            staffId: version.userId,
            targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天內完成
          }
        });
      }

      return updatedVersion;
    }),

  // 員工提交新版本（基於客戶意見修改後）
  submitRevisedVersion: publicProcedure
    .input(z.object({
      originalVersionId: z.string(),  // 被駁回的版本ID
      versionName: z.string(),
      contentUrl: z.string(),
      note: z.string().optional(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // 獲取原始版本
      const originalVersion = await db.workVersion.findUnique({
        where: { id: input.originalVersionId },
        include: { phase: true }
      });

      if (!originalVersion) {
        throw new Error("原始版本不存在");
      }

      // 找出該階段該專案的最大版本號
      const maxVersionNumber = await db.workVersion.aggregate({
        where: {
          phaseId: originalVersion.phaseId,
          projectId: originalVersion.projectId,
        },
        _max: {
          versionNumber: true,
        }
      });

      const newVersionNumber = (maxVersionNumber._max.versionNumber || 0) + 1;

      // 將舊版本標記為非最新
      await db.workVersion.update({
        where: { id: input.originalVersionId },
        data: { isLatest: false }
      });

      // 創建新版本
      const newVersion = await db.workVersion.create({
        data: {
          versionName: input.versionName,
          contentUrl: input.contentUrl,
          note: input.note,
          userId: input.userId,
          projectId: originalVersion.projectId,
          phaseId: originalVersion.phaseId,
          previousVersionId: input.originalVersionId,
          versionNumber: newVersionNumber,
          reviewStatus: 'PENDING',  // 重置為待審核
          isLatest: true,
        }
      });

      return newVersion;
    }),
});