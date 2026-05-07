// //src/app/admin/finance/components/QuotationToInvoiceModal.tsx

// "use client";
// import { useForm } from "react-hook-form";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// // import { useCreateInvoiceFromQuotation } from "@/hooks/finance.api";
// import { cn } from "@/lib/utils";
// import { QuotationDTO } from "../types";
// import { useCreateInvoiceFromQuotation } from "../hooks/finanace_api";
// // import { QuotationDTO } from "@/types/finance";

// interface Props {
//   open: boolean;
//   onClose: () => void;
//   quotation: QuotationDTO;
// }

// export default function QuotationToInvoiceModal({ open, onClose, quotation }: Props) {
//   const createInvoice = useCreateInvoiceFromQuotation();
//   const { register, handleSubmit } = useForm({
//     defaultValues: {
//       dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
//       invoiceDate: new Date().toISOString().split("T")[0],
//     },
//   });

//   const onSubmit = async (data: { dueDate: string; invoiceDate: string }) => {
//     try {
//       await createInvoice.mutateAsync({
//         quotationId: quotation.id,
//         dueDate: new Date(data.dueDate),
//         invoiceDate: new Date(data.invoiceDate),
//         items: quotation.items.map((item) => ({
//           description: item.description,
//           quantity: item.quantity,
//           unitPrice: item.unitPrice,
//           customerPrice: item.customerPrice,
//         })),
//       });
//       onClose();
//       // 可重新導向到新收據頁面或刷新列表
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>從報價單轉換為收據</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit(onSubmit)}>
//           <div className="grid gap-4 py-4">
//             <div className="grid grid-cols-4 items-center gap-4">
//               <Label htmlFor="invoiceDate" className="text-right">收據日期</Label>
//               <Input id="invoiceDate" type="date" className="col-span-3" {...register("invoiceDate")} />
//             </div>
//             <div className="grid grid-cols-4 items-center gap-4">
//               <Label htmlFor="dueDate" className="text-right">到期日</Label>
//               <Input id="dueDate" type="date" className="col-span-3" {...register("dueDate")} />
//             </div>
//             <div className="border-t pt-2">
//               <p className="text-sm text-gray-500">將使用報價單的所有項目及客戶價格</p>
//               <p className="text-lg font-semibold">
//                 總金額：{quotation.totalAmount.toLocaleString("zh-TW", { style: "currency", currency: "TWD" })}
//               </p>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button type="button" variant="outline" onClick={onClose}>取消</Button>
//             <Button type="submit" disabled={createInvoice.isLoading}>
//               {createInvoice.isLoading ? "建立中..." : "確認轉換"}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }


"use client";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/utils/api";   // ← 改用直接 tRPC 呼叫，避開 import 路徑問題

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;          // ← 新增 onSuccess 回呼
  quotation: {
    id: string;
    number?: string | null;
    totalAmount: unknown;
    items: Array<{
      description?: string;
      quantity: number;
      unitPrice: number;
      customerPrice?: number;
    }>;
  };
}

export default function QuotationToInvoiceModal({ open, onClose, onSuccess, quotation }: Props) {
  const utils = api.useUtils();

  // 🟢 直接用 tRPC mutation，不需依賴外部 hook
  const createInvoice = api.adminQuotation.createFromQuotation.useMutation({
    onSuccess: () => {
      // 刷新報價單與收據列表
      utils.adminQuotation.getById.invalidate({ id: quotation.id });
      utils.adminInvoice.search.invalidate();
      onSuccess?.();
      onClose();
    },
  });

  const { register, handleSubmit } = useForm({
    defaultValues: {
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      invoiceDate: new Date().toISOString().split("T")[0],
    },
  });

  const toNumber = (val: unknown): number => {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "object" && val !== null && "toNumber" in val) {
      return (val as { toNumber(): number }).toNumber();
    }
    return Number(val);
  };

  const onSubmit = async (data: { dueDate: string; invoiceDate: string }) => {
    try {
      await createInvoice.mutateAsync({
        quotationId: quotation.id,
        dueDate: new Date(data.dueDate),
        invoiceDate: new Date(data.invoiceDate),
        items: quotation.items.map((item) => ({
          description: item.description ?? "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          customerPrice: item.customerPrice ?? 0,
        })),
      });
      // onSuccess 與 onClose 已在 mutation 的 onSuccess 中處理
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>從報價單轉換為收據</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoiceDate" className="text-right">收據日期</Label>
              <Input id="invoiceDate" type="date" className="col-span-3" {...register("invoiceDate")} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">到期日</Label>
              <Input id="dueDate" type="date" className="col-span-3" {...register("dueDate")} />
            </div>
            <div className="border-t pt-2">
              <p className="text-sm text-gray-500">將使用報價單的所有項目及客戶價格</p>
              <p className="text-lg font-semibold">
                總金額：NT$ {toNumber(quotation.totalAmount).toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending ? "建立中..." : "確認轉換"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
