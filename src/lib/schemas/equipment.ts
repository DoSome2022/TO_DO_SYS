

// src/lib/schemas/equipment.ts
import { z } from "zod";
import { EquipmentStatus, EquipmentOwnership, BillingType } from "@prisma/client";

// ====================== 1. 新增/編輯器材 ======================
export const createEquipmentSchema = z.object({
  name: z.string().min(1, "名稱必填"),
  model: z.string().optional(),
  serialNumber: z.string().min(1, "序號必填"),
  type: z.string().optional(),
  ownership: z.nativeEnum(EquipmentOwnership).default(EquipmentOwnership.COMPANY_OWNED),
  rentalDeadline: z.date().optional().nullable(),
  purchaseDate: z.date().optional().nullable(),
  notes: z.string().optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

// ====================== 2. 使用時間表子 Schema (Zod 4 相容) ======================
const usageScheduleSchema = z.object({
  usageStart: z.date({ 
    error: "請填寫使用開始時間" 
  }),
  usageEnd: z.date({ 
    error: "使用結束時間格式不正確" 
  }).optional(),
  note: z.string().optional(),
});

// ====================== 3. 借出器材 (Checkout) - 主要推薦使用這個 ======================
export const checkoutEquipmentSchema = z.object({
  equipmentId: z.string().min(1, "請選擇設備"),
  projectId: z.string().optional(),
  borrowedById: z.string().optional(),
  issuedById: z.string().optional(),
  externalRecipient: z.string().optional(),
  dueAt: z.date().optional(),
  borrowDurationDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
  staffTodoId: z.string().optional(), // 新增：關聯到 Staff_TODO 的 ID
  usageSchedules: z.array(usageScheduleSchema).optional(), // 這裡保持 optional
   workItemId: z.string().optional()
});

export type CheckoutEquipmentInput = z.infer<typeof checkoutEquipmentSchema>;

// ====================== 4. 歸還器材 ======================
export const returnEquipmentSchema = z.object({
  equipmentId: z.string().min(1, "設備ID必填"),
  receivedById: z.string().optional(),
  notes: z.string().optional(),
  condition: z.string().optional(),
});

export type ReturnEquipmentInput = z.infer<typeof returnEquipmentSchema>;

// ====================== 5. 更新器材狀態 ======================
export const updateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(EquipmentStatus),
  notes: z.string().optional(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// ====================== 6. 舊的 borrowSchema（若還在使用，可保留或刪除） ======================
export const borrowSchema = z.object({
  projectId: z.string().optional(),
  userId: z.string().optional(),
  externalRecipient: z.string().optional(),

  usageStartTime: z.date({ 
    error: "請選擇實際開始使用時間" 
  }).optional(),

  dueAt: z.date({ 
    error: "請選擇預計歸還時間" 
  }).optional(),

  notes: z.string().optional(),
});

export type BorrowFormValues = z.infer<typeof borrowSchema>;


