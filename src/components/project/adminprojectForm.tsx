"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { projectFormAdminSchema, type ProjectFormValues } from "@/lib/schemas/project";

interface AdminProjectFormProps {
  onSubmit: (data: ProjectFormValues) => Promise<void>;
  isLoading: boolean;
  pmCandidates: { id: string; name: string | null }[];
  customers: { id: string; name: string | null }[];
  companies: { id: string; name: string }[];
  availableServices: { id: string; name: string; price: any }[];
}

export function AdminProjectForm({ 
  onSubmit, isLoading, pmCandidates, customers, companies, availableServices 
}: AdminProjectFormProps) {
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormAdminSchema),
    defaultValues: { 
      title: "", description: "", status: "IN_PROGRESS", priority: "MEDIUM", 
      pmId: "", customerId: "", companyProfileId: "", startDate: "", endDate: "",
      services: [{ serviceId: "", customName: "", quantity: 1, unitPrice: 0 }] 
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  const handleSubmit = async (data: ProjectFormValues) => {
    await onSubmit(data);
    form.reset();
    window.location.reload(); 
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      
      {/* 第一區塊：專案基本資料 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
        <h3 className="md:col-span-2 font-semibold text-lg border-b pb-2 mb-2">專案基本資訊</h3>
        
        <div>
          <label className="text-sm block mb-1">專案名稱 *</label>
          <Input {...form.register("title")} placeholder="例如：官網開發案" disabled={isLoading} />
        </div>

        <div>
          <label className="text-sm block mb-1">指定 PM (專案經理)</label>
          <select {...form.register("pmId")} className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">-- 請選擇 PM --</option>
            {pmCandidates.map((pm) => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm block mb-1">專案描述</label>
          <Input {...form.register("description")} placeholder="輸入專案概述..." disabled={isLoading} />
        </div>

        {/* 👇 新增：開始日期與結束日期 */}
        <div>
          <label className="text-sm block mb-1">開始日期</label>
          <Input type="date" {...form.register("startDate")} disabled={isLoading} />
        </div>
        <div>
          <label className="text-sm block mb-1">結束/預計完成日期</label>
          <Input type="date" {...form.register("endDate")} disabled={isLoading} />
        </div>
      </div>

      {/* 第二區塊：報價單綁定設定 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
        <h3 className="md:col-span-2 font-semibold text-lg border-b pb-2 mb-2">報價單與客戶綁定</h3>
        
        <div>
          <label className="text-sm block mb-1">選擇客戶 *</label>
          <select {...form.register("customerId")} className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">-- 請選擇客戶 --</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm block mb-1">發出報價單的公司抬頭 *</label>
          <select {...form.register("companyProfileId")} className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">-- 請選擇我方公司抬頭 --</option>
            {companies.map((comp) => <option key={comp.id} value={comp.id}>{comp.name}</option>)}
          </select>
        </div>
      </div>

      {/* 第三區塊：動態服務項目列表 */}
      <div className="border p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h3 className="font-semibold text-lg">報價單服務項目內容</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ serviceId: "", customName: "", quantity: 1, unitPrice: 0 })}>
            + 新增一筆服務
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col md:flex-row gap-3 items-start md:items-end p-3 border rounded bg-white dark:bg-black/20">
              
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">選擇標準服務 *</label>
                <select {...form.register(`services.${index}.serviceId`)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">-- 選擇服務 --</option>
                  {availableServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">自訂名稱 (選填)</label>
                <Input {...form.register(`services.${index}.customName`)} placeholder="客製化顯示名稱" />
              </div>

              <div className="w-24">
                <label className="text-xs text-gray-500 mb-1 block">數量</label>
                <Input type="number" {...form.register(`services.${index}.quantity`, { valueAsNumber: true })} />
              </div>

              <div className="w-32">
                <label className="text-xs text-gray-500 mb-1 block">單價</label>
                <Input type="number" {...form.register(`services.${index}.unitPrice`, { valueAsNumber: true })} />
              </div>

              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length === 1} className="h-9 w-9 shrink-0">
                X
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="w-full md:w-auto px-8">
          {isLoading ? "處理中..." : "建立專案與報價單"}
        </Button>
      </div>
    </form>
  );
}
