// src/components/equipment/equipmentCheckoutDialog.tsx
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Plus, Trash2, CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils"; // 確保您的專案有這個 shadcn 的 utils
import { trpc } from "../../../trpc/client";

// 直接引入後端 Schema
import { checkoutEquipmentSchema } from "@/lib/schemas/equipment";
import { z } from "zod";

// ==================== 前端表單 Schema ====================
const formSchema = checkoutEquipmentSchema.extend({
  sourceType: z.enum(["COMPANY", "EXTERNAL"]),
  equipmentId: z.string().optional(),
  externalName: z.string().optional(),
  externalSupplier: z.string().optional(),
  externalCost: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.sourceType === "COMPANY" && !data.equipmentId) {
    ctx.addIssue({ 
      code: z.ZodIssueCode.custom, 
      message: "請選擇公司設備", 
      path: ["equipmentId"] 
    });
  }
  if (data.sourceType === "EXTERNAL" && !data.externalName) {
    ctx.addIssue({ 
      code: z.ZodIssueCode.custom, 
      message: "請輸入外部工具名稱", 
      path: ["externalName"] 
    });
  }
});

type FormValues = z.infer<typeof formSchema>;


interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId?: string | null;
  workItemTitle: string;
  userId: string;
  taskId?: string; // ✅ 加上這行：定義 taskId 為可選字串
}

export function EquipmentCheckoutDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectId, 
  workItemTitle, 
  userId,
  taskId // ✅ 加上這行：從 props 中接收 taskId
}: Props) {
  
  const utils = trpc.useUtils();
  const [sourceType, setSourceType] = useState<"COMPANY" | "EXTERNAL">("COMPANY");

  const { data: availableEquipments, isLoading: isLoadingEquipments } = 
    trpc.equipment.getAvailableEquipment.useQuery(
      undefined, 
      { enabled: isOpen && sourceType === "COMPANY" }
    );

  const checkoutCompanyEq = trpc.equipment.checkout.useMutation({
    onSuccess: () => {
      toast.success("已成功借用公司設備");
      utils.equipment.getAll.invalidate();
      
      // ✅ 判斷如果有傳 onSuccess，就執行 onSuccess，否則執行 onClose
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const createAndCheckoutExternalEq = trpc.equipment.create.useMutation({
    onSuccess: async (newEq) => {
      await checkoutCompanyEq.mutateAsync({
        equipmentId: newEq.id,
        projectId: projectId || undefined,
        borrowedById: userId,
        notes: `為任務[${workItemTitle}]租用/自備。備註：${form.getValues("notes") || ""}`,
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceType: "COMPANY",
      equipmentId: "",
      externalName: "",
      externalSupplier: "",
      externalCost: "0",
      notes: "",
      dueAt: undefined,
      borrowDurationDays: undefined,
      usageSchedules: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "usageSchedules",
  });

const onSubmit = async (values: FormValues) => {
    if (values.sourceType === "COMPANY") {
      checkoutCompanyEq.mutate({
        equipmentId: values.equipmentId!,
        projectId: projectId || undefined,
        borrowedById: userId,
        dueAt: values.dueAt,
        borrowDurationDays: values.borrowDurationDays,
        usageSchedules: values.usageSchedules,
        notes: `任務: ${workItemTitle}\n備註: ${values.notes || ""}`,
        workItemId: taskId // ✅ 確保 onSubmit 的時候把 taskId 傳給後端
      });
    } else {
      const numericCost = values.externalCost ? Number(values.externalCost) : 0;
      createAndCheckoutExternalEq.mutate({
        name: values.externalName!,
        ownership: "EXTERNAL_RENTAL",
        supplierName: values.externalSupplier || undefined,
        price: isNaN(numericCost) ? 0 : numericCost,
        notes: values.notes || undefined,
      });
    }
  };

  console.log(" Bug : ", form.formState.errors ,"-- End --")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>借用設備 / 工具</DialogTitle>
          <DialogDescription>
            為任務「{workItemTitle}」登記所需裝備
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 裝備來源選擇 */}
            <FormField
              control={form.control}
              name="sourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>裝備來源</FormLabel>
                  <Select 
                    onValueChange={(val: "COMPANY" | "EXTERNAL") => {
                      field.onChange(val);
                      setSourceType(val);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇裝備來源" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COMPANY">公司現有裝備</SelectItem>
                      <SelectItem value="EXTERNAL">外部租借 / 自備工具</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 公司設備區塊 */}
            {sourceType === "COMPANY" ? (
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="equipmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>選擇公司設備</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={isLoadingEquipments ? "載入中..." : "請選擇可用的設備"} 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableEquipments?.map((eq) => (
                            <SelectItem key={eq.id} value={eq.id}>
                              {eq.name}
                              {eq.model ? ` (${eq.model})` : ""}
                              {eq.billingType !== "NONE" 
                                ? ` - $${eq.price}/${eq.billingType}` 
                                : " - 免費"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ✅ 改用 DatePicker: 預計歸還時間 */}
                <FormField
                  control={form.control}
                  name="dueAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col mt-2">
                      <FormLabel>預計歸還日期（大概什麼時候還）</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "yyyy/MM/dd", { locale: zhTW })
                              ) : (
                                <span>選擇歸還日期</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0)) // 禁用過去的日子
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 <FormField
                  control={form.control}
                  name="borrowDurationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>預計借用天數（選填）</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="例如：10" 
                          {...field}
                          // ✅ 確保 value 不會是 undefined
                          value={field.value ?? ""} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 實際使用時間表 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>實際使用時間表（什麼時候會用）</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ usageStart: new Date(), usageEnd: undefined, note: "" })}
                    >
                      <Plus className="w-4 h-4 mr-1" /> 新增使用時段
                    </Button>
                  </div>

                  {fields.map((fieldItem, index) => (
                    <div key={fieldItem.id} className="p-4 bg-background border rounded-md space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        
                        {/* ✅ 改用 DatePicker: 開始時間 */}
                        <FormField
                          control={form.control}
                          name={`usageSchedules.${index}.usageStart`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>使用開始日</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "yyyy/MM/dd", { locale: zhTW })
                                      ) : (
                                        <span>選擇開始日</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* ✅ 改用 DatePicker: 結束時間 */}
                        <FormField
                          control={form.control}
                          name={`usageSchedules.${index}.usageEnd`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>使用結束日（選填）</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "yyyy/MM/dd", { locale: zhTW })
                                      ) : (
                                        <span>選擇結束日</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ?? undefined} // 確保不是 null，若為 null 轉為 undefined
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`usageSchedules.${index}.note`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>用途備註（選填）</FormLabel>
                            <FormControl>
                              <Input placeholder="例如：第2天中午外拍、第8天下午拍攝訪談" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> 刪除此時段
                      </Button>
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      尚未新增使用時段，按下「新增使用時段」按鈕開始記錄
                    </p>
                  )}
                </div>
              </div>
            ) : (
               /* 外部工具區塊 */
              <div className="space-y-3 p-3 bg-muted rounded-md border">
                <FormField
                  control={form.control}
                  name="externalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>外部工具名稱</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="例如：DJI 空拍機、租用燈光設備" 
                          {...field} 
                          value={field.value ?? ""} // ✅ 防錯
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="externalSupplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>來源 / 供應商 (選填)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="例如：旋轉拍賣、朋友自帶、出租店" 
                            {...field} 
                            value={field.value ?? ""} // ✅ 防錯
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="externalCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>花費金額 (選填)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                            value={field.value ?? ""} // ✅ 防錯
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* 共通備註 */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>借用備註 (選填)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="請輸入器材狀況、特殊需求或其他備註..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={checkoutCompanyEq.isPending || createAndCheckoutExternalEq.isPending}
              >
                {(checkoutCompanyEq.isPending || createAndCheckoutExternalEq.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                確認登記
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
