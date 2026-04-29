// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// import { Button } from "@/components/ui/button"; 
// import { toast } from "sonner";
// import { trpc } from "../../../trpc/client";
// import { borrowSchema } from "@/lib/schemas/equipment";
// import z from "zod";

// interface BorrowModalProps {
//   equipmentId: string;
//   equipmentName: string;
//   currentStatus: string;
//   billingType?: string; // 新增 Props
//   price?: number;       // 新增 Props
// }
// type BorrowFormValues = z.infer<typeof borrowSchema>;
// export function BorrowEquipmentModal({ equipmentId, equipmentName, currentStatus }: BorrowModalProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const router = useRouter();

//   // 表單狀態全改為空字串初始值
//   const [projectId, setProjectId] = useState("");
//   const [borrowedById, setBorrowedById] = useState("");
//   const [dueAt, setDueAt] = useState("");
//   const [notes, setNotes] = useState("");
//   const [isExternal, setIsExternal] = useState(false);
//   const [externalRecipient, setExternalRecipient] = useState("");

//   const checkOutMutation = trpc.equipment.checkout.useMutation({
//     onSuccess: () => {
//       toast.success("設備外借成功！");
//       setIsOpen(false);
//       router.refresh(); 
//     },
//     onError: (error) => {
//       toast.error(`外借失敗: ${error.message}`);
//     }
//   });

//   const handleBorrow = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // 將空字串轉換為 undefined，以符合可選欄位的邏輯
//     checkOutMutation.mutate({
//       equipmentId,
//       projectId: projectId || undefined, 
//       borrowedById: borrowedById || undefined, 
//       externalRecipient: (isExternal && externalRecipient) ? externalRecipient : undefined,
//       notes: notes || undefined,
//       dueAt: dueAt ? new Date(dueAt) : undefined,
//     });
//   };

//   if (currentStatus !== "AVAILABLE") {
//     return (
//       <Button disabled variant="outline">
//         目前無法外借 (狀態: {currentStatus})
//       </Button>
//     );
//   }

//   return (
//     <>
//       <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
//         外借設備
//       </Button>

//       {isOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
//             <h2 className="text-xl font-bold mb-4">外借設備: {equipmentName}</h2>
            
//             <form onSubmit={handleBorrow} className="space-y-4">
              
//               <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md border">
//                 <input
//                   type="checkbox"
//                   id="external-toggle"
//                   checked={isExternal}
//                   onChange={(e) => setIsExternal(e.target.checked)}
//                   className="w-4 h-4 text-blue-600 rounded"
//                 />
//                 <label htmlFor="external-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
//                   借給其他公司 / 外部單位
//                 </label>
//               </div>

//               {isExternal && (
//                 <div className="pl-4 border-l-2 border-blue-500">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     外部公司名稱 (選填)
//                   </label>
//                   <input
//                     type="text"
//                     value={externalRecipient}
//                     onChange={(e) => setExternalRecipient(e.target.value)}
//                     className="w-full border border-gray-300 rounded-md p-2 text-black focus:ring-blue-500"
//                     placeholder="請輸入借用的公司或單位名稱"
//                   />
//                 </div>
//               )}

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   關聯專案 ID (選填)
//                 </label>
//                 <input
//                   type="text"
//                   value={projectId}
//                   onChange={(e) => setProjectId(e.target.value)}
//                   className="w-full border border-gray-300 rounded-md p-2 text-black"
//                   placeholder="未指定可留空"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   借用員工 ID (選填)
//                 </label>
//                 <input
//                   type="text"
//                   value={borrowedById}
//                   onChange={(e) => setBorrowedById(e.target.value)}
//                   className="w-full border border-gray-300 rounded-md p-2 text-black"
//                   placeholder="未指定可留空"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   預計歸還時間 (選填)
//                 </label>
//                 <input
//                   type="date"
//                   value={dueAt}
//                   onChange={(e) => setDueAt(e.target.value)}
//                   className="w-full border border-gray-300 rounded-md p-2 text-black"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   備註 (選填)
//                 </label>
//                 <textarea
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   className="w-full border border-gray-300 rounded-md p-2 text-black"
//                   placeholder="輸入備註資訊..."
//                 />
//               </div>

//               <div className="flex justify-end gap-2 mt-6">
//                 <Button 
//                   type="button" 
//                   variant="outline" 
//                   onClick={() => setIsOpen(false)}
//                   disabled={checkOutMutation.isPending}
//                 >
//                   取消
//                 </Button>
//                 <Button 
//                   type="submit" 
//                   disabled={checkOutMutation.isPending}
//                 >
//                   {checkOutMutation.isPending ? "處理中..." : "確認外借"}
//                 </Button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// src/components/equipment/BorrowEquipmentModal.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

// 👇 從你的 Schema 檔案引入
import { borrowSchema, type BorrowFormValues } from "@/lib/schemas/equipment"; 

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "../../../trpc/client";

interface BorrowEquipmentModalProps {
  equipmentId: string;
  equipmentName: string;
  currentStatus: string;
  billingType?: string; 
  price?: number;       
}

export function BorrowEquipmentModal({ 
  equipmentId, 
  equipmentName, 
  currentStatus,
  billingType,
  price
}: BorrowEquipmentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [borrowType, setBorrowType] = useState<"internal" | "external">("internal");

  // 初始化 Form，加入 usageStartTime 預設值為現在
  const form = useForm<BorrowFormValues>({
    resolver: zodResolver(borrowSchema),
    defaultValues: {
      projectId: "",
      userId: "",
      externalRecipient: "",
      notes: "",
      usageStartTime: new Date(), 
    },
  });

  // 👇 使用 checkout Mutation
  const checkoutMutation = trpc.equipment.checkout.useMutation({
    onSuccess: () => {
      toast.success("設備借用登記成功！");
      setIsOpen(false);
      form.reset();
      window.location.reload(); 
    },
    onError: (error) => {
      toast.error(`借用失敗：${error.message}`);
    },
  });

  const onSubmit = (data: BorrowFormValues) => {
    // 組合給後端的資料，對齊 checkoutEquipmentSchema
    const finalData = {
      equipmentId,
      projectId: data.projectId || undefined,
      borrowedById: borrowType === "internal" ? data.userId || undefined : undefined,
      externalRecipient: borrowType === "external" ? data.externalRecipient || undefined : undefined,
      dueAt: data.dueAt,
      usageStartTime: data.usageStartTime, // 傳送精準時間給後端計費
      notes: data.notes || undefined,
    };
    
    checkoutMutation.mutate(finalData);
  };

  const isAvailable = currentStatus === "AVAILABLE";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={!isAvailable}>
          {isAvailable ? "登記借用" : "目前無法借用"}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>借用設備：{equipmentName}</DialogTitle>
          {/* 計費提示 */}
          {billingType && billingType !== "NONE" && (
            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded mt-2">
              注意：此設備為 {billingType === "HOURLY" ? "按小時計費" : "按天計費"}，單價為 ${price}。
              系統將依據「實際開始使用時間」計算費用。
            </div>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <Tabs value={borrowType} onValueChange={(v) => setBorrowType(v as "internal" | "external")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="internal">內部員工</TabsTrigger>
                <TabsTrigger value="external">外部人員</TabsTrigger>
              </TabsList>
              
              <TabsContent value="internal" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>借用人 (員工 ID)</FormLabel>
                      <FormControl>
                        <Input placeholder="輸入員工 ID..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>關聯專案 ID (選填)</FormLabel>
                      <FormControl>
                        <Input placeholder="輸入專案 ID..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="external" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="externalRecipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>外部借用人 / 單位名稱</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：王小明 或 某某公司" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              {/* 精準開始時間 */}
              <FormField
                control={form.control}
                name="usageStartTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>實際開始使用時間</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                            {field.value ? format(field.value, "PP", { locale: zhTW }) : <span>選擇日期</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 預計歸還時間 (dueAt) */}
              <FormField
                control={form.control}
                name="dueAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>預計歸還時間</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                            {field.value ? format(field.value, "PP", { locale: zhTW }) : <span>選擇日期</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備註</FormLabel>
                  <FormControl>
                    <Textarea placeholder="借用原因或特殊需求..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={checkoutMutation.isPending}>
              {checkoutMutation.isPending ? "處理中..." : "確認借用"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
