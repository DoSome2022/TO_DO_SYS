"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { serviceformSchema } from "@/lib/schemas/service";
// 假設你有使用 shadcn/ui 的 Input, Button


type FormValues = z.infer<typeof serviceformSchema>;

interface ServiceFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading: boolean;
}

export function ServiceForm({ onSubmit, isLoading }: ServiceFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(serviceformSchema),
    defaultValues: { name: "", type: "", price: 0 },
  });

  const handleSubmit = async (data: FormValues) => {
    // 👇 加入這行，看看你輸入的文字有沒有真的進來
    console.log("準備送給後端的資料:", data); 
    
    await onSubmit(data);
    window.location.reload(); 
    
  };


  console.log(" Bug: ", form.formState.errors ,"--- End ---")

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex gap-4 items-end">
      <div>
        <label className="text-sm">服務名稱</label>
        <Input {...form.register("name")} placeholder="例如：UI 設計" />
      </div>
      <div>
        <label className="text-sm">服務類型</label>
        <Input {...form.register("type")} placeholder="例如：DESIGN" />
      </div>
      <div>
        <label className="text-sm">預設價錢</label>
        <Input type="number" {...form.register("price", { valueAsNumber: true })}  />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "建立中..." : "新增服務"}
      </Button>
    </form>
  );
}
