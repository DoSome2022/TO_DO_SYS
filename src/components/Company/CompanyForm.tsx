"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";   // 依據你的 shadcn 路徑調整
import { Button } from "@/components/ui/button"; // 依據你的 shadcn 路徑調整
import { companyProfileSchema } from "@/lib/schemas/company";
import { api } from "@/utils/api";               // 依據你的 tRPC api 路徑調整

type FormValues = z.infer<typeof companyProfileSchema>;

interface CompanyFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading: boolean;
}

export function CompanyForm({ onSubmit, isLoading }: CompanyFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: { name: "", logoUrl: "", address: "", phone: "", taxId: "" },
  });

  // 1. 呼叫我們剛剛在 companyProfile router 寫好的上傳 API
  const uploadMutation = api.companyProfile.uploadLogo.useMutation();
  
  // 2. 用來在畫面上顯示上傳後的預覽圖片
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // ==========================================
  // 處理圖片選擇與上傳
  // ==========================================
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 檢查檔案大小 (選用，這裡限制 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("圖片大小不能超過 5MB");
      return;
    }

    // 將圖片讀取為 Base64 格式
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const toastId = toast.loading("圖片上傳中...");
      
      try {
        // 傳送給 tRPC 後端，由後端上傳到阿里雲 OSS
        const { url } = await uploadMutation.mutateAsync({
          filename: file.name,
          base64Data,
        });

        // 成功後，將回傳的 url 設定到 react-hook-form 的 logoUrl 欄位中
        form.setValue("logoUrl", url);
        setPreviewUrl(url); // 顯示預覽圖
        
        toast.success("Logo 上傳成功！", { id: toastId });
      } catch (error) {
        toast.error("上傳失敗，請檢查網路或系統設定", { id: toastId });
      }
    };
    reader.readAsDataURL(file); // 觸發讀取
  };

  // ==========================================
  // 處理表單送出
  // ==========================================
  const handleSubmit = async (data: FormValues) => {
    await onSubmit(data);
    form.reset();         // 成功建立後清空表單
    setPreviewUrl("");    // 成功建立後清空預覽圖
  };

  const isSubmitting = isLoading || uploadMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        
        {/* --- 基本文字欄位 --- */}
        <div>
          <label className="text-sm block mb-1">公司名稱 *</label>
          <Input {...form.register("name")} placeholder="例如：某某科技有限公司" />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label className="text-sm block mb-1">統一編號</label>
          <Input {...form.register("taxId")} placeholder="例如：12345678" />
        </div>
        
        <div>
          <label className="text-sm block mb-1">聯絡電話</label>
          <Input {...form.register("phone")} placeholder="例如：02-12345678" />
        </div>
        
        <div className="col-span-2 md:col-span-3">
          <label className="text-sm block mb-1">公司地址</label>
          <Input {...form.register("address")} placeholder="公司詳細地址" />
        </div>

        {/* --- Logo 上傳區塊 --- */}
        <div className="col-span-2 md:col-span-3 p-4 border rounded-lg bg-muted/30">
          <label className="text-sm font-medium block mb-2">公司 Logo 上傳 (可選)</label>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            
            {/* 隱藏的字串欄位，負責跟著表單送出真實的 URL */}
            <input type="hidden" {...form.register("logoUrl")} />
            
            {/* 真實的上傳按鈕 */}
            <div className="flex-1">
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="w-full max-w-sm cursor-pointer file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">支援 JPG, PNG, WEBP 等格式，建議 5MB 以下。</p>
            </div>

            {/* 顯示上傳後的預覽圖 */}
            {previewUrl && (
              <div className="flex-shrink-0 relative w-20 h-20 bg-white border rounded-md overflow-hidden flex items-center justify-center">
                <img 
                  src={previewUrl} 
                  alt="Logo Preview" 
                  className="max-w-full max-h-full object-contain p-1"
                />
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* --- 送出按鈕 --- */}
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "處理中..." : "新增公司資料"}
        </Button>
      </div>
    </form>
  );
}
