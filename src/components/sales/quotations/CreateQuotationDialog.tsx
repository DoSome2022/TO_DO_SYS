// components/sales/CreateQuotationDialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '../../../../trpc/client';

const createQuotationSchema = z.object({
  title: z.string().min(1, '請輸入報價單標題'),
  customerId: z.string().min(1, '請選擇客戶'),
  customerPrice: z.number().min(0, '價格必須大於等於 0'),
});

type CreateQuotationForm = z.infer<typeof createQuotationSchema>;

interface CreateQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateQuotationDialog({ open, onOpenChange, onSuccess }: CreateQuotationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 獲取可用客戶列表
  const { data: customers = [] } = trpc.quotation.getAvailableCustomers.useQuery(undefined, {
    enabled: open,
  });
  
  const createQuotation = trpc.quotation.createQuotation.useMutation({
    onSuccess: (data) => {
      toast.success('報價單建立成功');
      reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || '建立失敗');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateQuotationForm>({
    resolver: zodResolver(createQuotationSchema),
    defaultValues: {
      title: '',
      customerId: '',
      customerPrice: 0,
    },
  });
  
  const customerPrice = watch('customerPrice');
  
  const onSubmit = (data: CreateQuotationForm) => {
    setIsSubmitting(true);
    createQuotation.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新增報價單</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 報價單標題 */}
          <div className="space-y-2">
            <Label htmlFor="title">報價單標題 *</Label>
            <Input
              id="title"
              placeholder="例如：某某公司網站建置案"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          
          {/* 選擇客戶 */}
          <div className="space-y-2">
            <Label htmlFor="customerId">客戶 *</Label>
            <Select onValueChange={(value) => setValue('customerId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="請選擇客戶" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.customname || customer.name || customer.companyname || customer.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && (
              <p className="text-sm text-red-500">{errors.customerId.message}</p>
            )}
          </div>
          
          {/* 報價金額 */}
          <div className="space-y-2">
            <Label htmlFor="customerPrice">報價金額 (HK$) *</Label>
            <Input
              id="customerPrice"
              type="number"
              step="0.01"
              placeholder="0"
              {...register('customerPrice', { valueAsNumber: true })}
            />
            {errors.customerPrice && (
              <p className="text-sm text-red-500">{errors.customerPrice.message}</p>
            )}
          </div>
          
          {/* 預覽金額 */}
          {customerPrice > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">預估總金額</p>
              <p className="text-2xl font-bold text-primary">
                HK$ {customerPrice.toLocaleString()}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  建立中...
                </>
              ) : (
                '建立報價單'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}