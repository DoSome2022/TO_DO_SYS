// src/components/equipment/equipment-toolbar.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod"; // 直接在這裡定義 Schema 方便你對照
import { api } from "@/utils/api";

// ---------------------------------------------------------
// 1. 定義完整的 Zod Schema (對應你的 Prisma Model)
// ---------------------------------------------------------
const createEquipmentSchema = z.object({
  name: z.string().min(1, "器材名稱必填"),
  model: z.string().optional(), // 型號
  serialNumber: z.string().optional(), // 序號 (Prisma 是 optional，這裡改為選填)
  
  // 處理數字輸入：HTML input type="number" 傳來的是字串，需要轉型
  value: z.coerce.number().min(0).optional(), 
  
  notes: z.string().optional(),
  team: z.string().optional(), // 歸屬團隊

  // 所有權設定
  ownership: z.enum(["COMPANY_OWNED", "EXTERNAL_RENTAL"]),
  
  // 外部租借相關欄位 (只有當 ownership 為 EXTERNAL_RENTAL 時才需要填)
  supplierName: z.string().optional(),
  supplierContact: z.string().optional(),
  
  borrowerName: z.string().optional(),
  borrowDate: z.string().optional().or(z.date().optional()), // 允許字串或日期格式

  // 處理日期：HTML input type="date" 傳來字串，需要轉型
  rentalDeadline: z.coerce.date().optional().nullable(),
});

// 自動推斷型別
type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

// ---------------------------------------------------------
// 2. Component
// ---------------------------------------------------------
export function EquipmentToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = api.useUtils();

  const createMutation = api.equipment.create.useMutation({
    onSuccess: () => {
      setIsOpen(false);
      reset(); // 成功後重置表單
      utils.equipment.getAll.invalidate();
      alert("新增成功！");
    },
    onError: (err) => alert(err.message),
  });

  // 3. 初始化 useForm (注意：不傳泛型 <CreateEquipmentInput>，讓 TS 自動推斷)
  const { 
    register, 
    handleSubmit, 
    reset, 
    watch, // 用來監聽欄位變化
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(createEquipmentSchema),
    // 🔥 這裡填寫完整且正確的初始值，解決你的報錯
    defaultValues: {
      name: "",
      model: "",
      serialNumber: "",
      value: 0,
      notes: "",
      team: "",
      ownership: "COMPANY_OWNED", // 預設為公司自有
      supplierName: "",
      supplierContact: "",
      rentalDeadline: null,
    },
  });

  // 監聽 ownership 欄位，決定是否顯示租借欄位
  const ownershipType = watch("ownership");

  const onSubmit = (data: CreateEquipmentInput) => {
    // 這裡可以做最後的資料清理，例如如果是 COMPANY_OWNED，就把 supplier 欄位清空
    if (data.ownership === "COMPANY_OWNED") {
      data.supplierName = undefined;
      data.supplierContact = undefined;
      data.rentalDeadline = null;
    }
    createMutation.mutate(data);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
      >
        + 新增器材
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          {/* 增加 max-w-2xl 讓寬度變寬，適合多欄位 */}
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-6 border-b pb-2">新增器材資料</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* --- 第一區塊：基本資訊 (2欄佈局) --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">器材名稱 *</label>
                  <input {...register("name")} className="w-full border p-2 rounded focus:ring-2 focus:ring-black/10 outline-none" placeholder="例如：Sony A7M4" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">型號</label>
                  <input {...register("model")} className="w-full border p-2 rounded focus:ring-2 focus:ring-black/10 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">序號 (S/N)</label>
                  <input {...register("serialNumber")} className="w-full border p-2 rounded focus:ring-2 focus:ring-black/10 outline-none" placeholder="機身序號" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">價值 (金額)</label>
                  <input 
                    type="number" 
                    {...register("value")} 
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-black/10 outline-none" 
                    placeholder="0"
                  />
                </div>

                 <div>
                  <label className="block text-sm font-medium mb-1">設備分類</label>
                  <input {...register("team")} className="w-full border p-2 rounded focus:ring-2 focus:ring-black/10 outline-none" placeholder="例如：攝影組" />
                </div>
              </div>

              {/* --- 第二區塊：所有權設定 --- */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-2">資產來源</label>
                <select 
                  {...register("ownership")} 
                  className="w-full border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-black/10 outline-none"
                >
                  <option value="COMPANY_OWNED">公司自有資產 (Company Owned)</option>
                  <option value="EXTERNAL_RENTAL">外部租借 (External Rental)</option>
                </select>
              </div>

              {/* --- 第三區塊：外部租借詳細資料 (只有選外部租借才顯示) --- */}
              {ownershipType === "EXTERNAL_RENTAL" && (
                <div className="bg-amber-50 p-4 rounded border border-amber-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="col-span-1 md:col-span-2 text-sm text-amber-800 font-bold border-b border-amber-200 pb-2 mb-2 flex items-center gap-2">
                    📋 外部租借詳細資訊
                  </div>
                  
                  {/* 新增：經手人 / 借用人 */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-amber-900">經手人 / 負責人</label>
                    <input 
                      {...register("borrowerName")} 
                      className="w-full border border-amber-200 p-2 rounded bg-white focus:ring-amber-500 focus:border-amber-500" 
                      placeholder="誰負責去借的？ (例: Alex)" 
                    />
                  </div>

                  {/* 新增：借入日期 */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-amber-900">借入日期 (Start Date)</label>
                    <input 
                      type="date" 
                      {...register("borrowDate")} 
                      className="w-full border border-amber-200 p-2 rounded bg-white focus:ring-amber-500 focus:border-amber-500" 
                    />
                  </div>

                  {/* 原有：預計歸還日期 */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-amber-900">預計歸還日期 (Deadline)</label>
                    <input 
                      type="date" 
                      {...register("rentalDeadline")} 
                      className="w-full border border-amber-200 p-2 rounded bg-white focus:ring-amber-500 focus:border-amber-500" 
                    />
                  </div>

                  {/* 分隔線：供應商資訊 */}
                  <div className="col-span-1 md:col-span-2 border-t border-amber-200 my-1"></div>

                  {/* 原有：供應商名稱 */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-amber-900">供應商名稱</label>
                    <input 
                      {...register("supplierName")} 
                      className="w-full border border-amber-200 p-2 rounded bg-white focus:ring-amber-500 focus:border-amber-500" 
                      placeholder="例如：旋轉牧馬" 
                    />
                  </div>

                  {/* 原有：聯絡方式 */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-amber-900">聯絡方式</label>
                    <input 
                      {...register("supplierContact")} 
                      className="w-full border border-amber-200 p-2 rounded bg-white focus:ring-amber-500 focus:border-amber-500" 
                      placeholder="電話或聯絡人" 
                    />
                  </div>
                </div>
              )}


              {/* --- 第四區塊：備註 --- */}
              <div>
                <label className="block text-sm font-medium mb-1">備註 / 狀況描述</label>
                <textarea 
                  {...register("notes")} 
                  rows={3} 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-black/10 outline-none" 
                  placeholder="例如：鏡頭有輕微刮痕..."
                />
              </div>

              {/* --- 按鈕區 --- */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {createMutation.isPending ? "處理中..." : "確認新增"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
