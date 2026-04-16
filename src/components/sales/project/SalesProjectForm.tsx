"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, UserCircle, Briefcase, FileText, Plus, Trash2, CalendarDays } from "lucide-react";

// 定義表單的資料驗證結構 (Zod Schema)
const salesProjectSchema = z.object({
  title: z.string().min(1, "請輸入專案名稱"),
  description: z.string().optional(),
  pmId: z.string().optional(),
  customerId: z.string().min(1, "必須綁定客戶"),
  companyProfileId: z.string().min(1, "請選擇發出報價單的公司抬頭"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  services: z.array(
    z.object({
      serviceId: z.string().min(1, "請選擇服務"),
      customName: z.string().optional(),
      quantity: z.number().min(1, "數量至少為 1"),
      unitPrice: z.number().min(0, "單價不能小於 0"),
    })
  ).min(1, "至少需要新增一項報價服務"),
});

export type SalesProjectFormValues = z.infer<typeof salesProjectSchema>;

interface SalesProjectFormProps {
  onSubmit: (data: SalesProjectFormValues) => Promise<void>;
  isLoading: boolean;
  defaultCustomerId: string | null;
  customers: { id: string; name: string }[];
  pmCandidates: { id: string; name: string | null }[];
  companies: { id: string; name: string }[];
  availableServices: { id: string; name: string; price?: number }[];
}

export default function SalesProjectForm({
  onSubmit,
  isLoading,
  defaultCustomerId,
  customers,
  pmCandidates,
  companies,
  availableServices,
}: SalesProjectFormProps) {
  
  const form = useForm<SalesProjectFormValues>({
    resolver: zodResolver(salesProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      pmId: "",
      customerId: defaultCustomerId || "", // 如果 URL 有帶入，自動填上
      companyProfileId: "",
      startDate: "",
      endDate: "",
      services: [{ serviceId: "", customName: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      
      {/* 區塊 1：專案與客戶綁定 */}
      <div className="bg-white border border-[#edebe9] rounded-md shadow-sm overflow-hidden">
        <div className="bg-[#faf9f8] px-5 py-3 border-b border-[#edebe9] flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#005fb8]" />
          <h3 className="text-[15px] font-semibold text-[#201f1e]">專案基本資訊</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div className="md:col-span-2">
            <label className="text-[13px] font-semibold text-[#201f1e] block mb-1.5">專案名稱 <span className="text-red-500">*</span></label>
            <input 
              {...form.register("title")} 
              className="w-full h-9 px-3 border border-[#8a8886] rounded-[4px] text-[14px] focus:outline-none focus:border-[#005fb8] focus:ring-1 focus:ring-[#005fb8]" 
              placeholder="專案名稱" 
            />
            {form.formState.errors.title && <p className="text-red-500 text-xs mt-1">{form.formState.errors.title.message}</p>}
          </div>

          <div>
            <label className="text-[13px] font-semibold text-[#201f1e] flex items-center gap-1 mb-1.5">
              <Building2 className="w-4 h-4" /> 關聯客戶 <span className="text-red-500">*</span>
            </label>
            <select 
              {...form.register("customerId")} 
              disabled={!!defaultCustomerId} // 如果 URL 有帶入，則鎖定不給改
              className={`w-full h-9 px-3 border border-[#8a8886] rounded-[4px] text-[14px] focus:outline-none ${defaultCustomerId ? "bg-[#f3f2f1] text-[#605e5c] cursor-not-allowed" : "bg-white"}`}
            >
              <option value="">-- 請選擇客戶 --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-[#201f1e] flex items-center gap-1 mb-1.5">
              <UserCircle className="w-4 h-4" /> 指定專案經理 (PM)
            </label>
            <select 
              {...form.register("pmId")} 
              className="w-full h-9 px-3 border border-[#8a8886] rounded-[4px] text-[14px] focus:outline-none focus:border-[#005fb8] focus:ring-1 focus:ring-[#005fb8] bg-white"
            >
              <option value="">-- 稍後指派 --</option>
              {pmCandidates.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-[#201f1e] flex items-center gap-1 mb-1.5">
              <CalendarDays className="w-4 h-4" /> 預計開始日
            </label>
            <input type="date" {...form.register("startDate")} className="w-full h-9 px-3 border border-[#8a8886] rounded-[4px] text-[14px]" />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-[#201f1e] flex items-center gap-1 mb-1.5">
              <CalendarDays className="w-4 h-4" /> 預計交付日
            </label>
            <input type="date" {...form.register("endDate")} className="w-full h-9 px-3 border border-[#8a8886] rounded-[4px] text-[14px]" />
          </div>
        </div>
      </div>

      {/* 區塊 2：報價單內容 */}
      <div className="bg-white border border-[#edebe9] rounded-md shadow-sm overflow-hidden">
        <div className="bg-[#faf9f8] px-5 py-3 border-b border-[#edebe9] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#005fb8]" />
            <h3 className="text-[15px] font-semibold text-[#201f1e]">報價單與服務項目</h3>
          </div>
          <button 
            type="button" 
            onClick={() => append({ serviceId: "", customName: "", quantity: 1, unitPrice: 0 })}
            className="flex items-center gap-1 text-[13px] text-[#005fb8] hover:text-[#004e98] font-medium"
          >
            <Plus className="w-4 h-4" /> 新增一筆服務
          </button>
        </div>
        
        <div className="p-5">
          <div className="mb-5 md:w-1/2">
            <label className="text-[13px] font-semibold text-[#201f1e] block mb-1.5">發出報價單的公司抬頭 <span className="text-red-500">*</span></label>
            <select 
              {...form.register("companyProfileId")} 
              className="w-full h-9 px-3 border border-[#8a8886] rounded-[4px] text-[14px] focus:outline-none focus:border-[#005fb8]"
            >
              <option value="">-- 請選擇我方公司抬頭 --</option>
              {companies.map(comp => <option key={comp.id} value={comp.id}>{comp.name}</option>)}
            </select>
            {form.formState.errors.companyProfileId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.companyProfileId.message}</p>}
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col md:flex-row gap-3 items-end p-4 bg-[#faf9f8] border border-[#edebe9] rounded-[4px]">
                
                <div className="w-full md:w-[30%]">
                  <label className="text-[12px] text-[#605e5c] mb-1 block">標準服務 <span className="text-red-500">*</span></label>
                  <select 
                    {...form.register(`services.${index}.serviceId`)} 
                    className="w-full h-9 px-2 border border-[#8a8886] rounded-[4px] text-[13px] bg-white"
                  >
                    <option value="">-- 選擇服務 --</option>
                    {availableServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="w-full md:flex-1">
                  <label className="text-[12px] text-[#605e5c] mb-1 block">自訂名稱 (客製化顯示)</label>
                  <input 
                    {...form.register(`services.${index}.customName`)} 
                    placeholder="例如：首頁 UI/UX 設計" 
                    className="w-full h-9 px-2 border border-[#8a8886] rounded-[4px] text-[13px]"
                  />
                </div>

                <div className="w-full md:w-20">
                  <label className="text-[12px] text-[#605e5c] mb-1 block">數量</label>
                  <input 
                    type="number" 
                    {...form.register(`services.${index}.quantity`, { valueAsNumber: true })} 
                    className="w-full h-9 px-2 border border-[#8a8886] rounded-[4px] text-[13px]"
                  />
                </div>

                <div className="w-full md:w-32">
                  <label className="text-[12px] text-[#605e5c] mb-1 block">單價 ($)</label>
                  <input 
                    type="number" 
                    {...form.register(`services.${index}.unitPrice`, { valueAsNumber: true })} 
                    className="w-full h-9 px-2 border border-[#8a8886] rounded-[4px] text-[13px]"
                  />
                </div>

                <button 
                  type="button" 
                  onClick={() => remove(index)} 
                  disabled={fields.length === 1}
                  className="h-9 w-9 flex-shrink-0 flex items-center justify-center text-[#a4262c] hover:bg-[#fde7e9] rounded-[4px] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {form.formState.errors.services && <p className="text-red-500 text-xs mt-2">{form.formState.errors.services.message}</p>}
        </div>
      </div>

      {/* 提交按鈕 */}
      <div className="flex justify-end pt-2">
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-[#005fb8] hover:bg-[#004e98] text-white px-8 py-2.5 rounded-[4px] text-[14px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? "處理中..." : "建立專案與報價單"}
        </button>
      </div>
    </form>
  );
}
