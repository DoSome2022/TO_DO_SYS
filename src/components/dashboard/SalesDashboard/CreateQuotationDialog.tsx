// src/components/dashboard/SalesDashboard/CreateQuotationDialog.tsx

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAvailableCustomers, useCreateQuotation } from "../../../../hooks/useQuotation";
// import { useAvailableCustomers, useCreateQuotation } from "@/hooks/useSalesData";

interface CreateQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateQuotationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateQuotationDialogProps) {
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerPrice, setCustomerPrice] = useState("");

  const { data: customers, isLoading: customersLoading } = useAvailableCustomers();
  const createQuotationMutation = useCreateQuotation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(customerPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("請輸入有效的金額");
      return;
    }

    try {
      await createQuotationMutation.mutateAsync({
        title,
        customerId,
        customerPrice: price,
      });
      toast.success("報價單建立成功");
      onSuccess();
      // 重置表單
      setTitle("");
      setCustomerId("");
      setCustomerPrice("");
    } catch (error) {
      toast.error("建立失敗");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增報價單</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">報價單名稱</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：某某公司官網建置案"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerId">客戶</Label>
              <Select value={customerId} onValueChange={setCustomerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="選擇客戶" />
                </SelectTrigger>
                <SelectContent>
                  {customersLoading ? (
                    <SelectItem value="loading" disabled>
                      載入中...
                    </SelectItem>
                  ) : customers?.length === 0 ? (
                    <SelectItem value="none" disabled>
                      暫無客戶，請先建立客戶
                    </SelectItem>
                  ) : (
                    customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.companyname || customer.name || customer.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPrice">報價金額 (USD)</Label>
              <Input
                id="customerPrice"
                type="number"
                step="0.01"
                value={customerPrice}
                onChange={(e) => setCustomerPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={createQuotationMutation.isPending}
            >
              {createQuotationMutation.isPending ? "建立中..." : "建立報價單"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}