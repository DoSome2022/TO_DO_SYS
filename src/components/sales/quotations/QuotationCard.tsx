// components/sales/QuotationCard.tsx
'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, MessageSquare, FolderOpen, User } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface QuotationCardProps {
  quotation: any; // 使用 any 或定義具體類型
  onClick: () => void;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: '草稿', variant: 'secondary' },
  NEGOTIATING: { label: '交涉中', variant: 'default' },
  WON: { label: '已贏單', variant: 'default' },
  LOST: { label: '已輸單', variant: 'destructive' },
};

export function QuotationCard({ quotation, onClick }: QuotationCardProps) {
  const status = statusConfig[quotation.status] || statusConfig.DRAFT;
  const customerPrice = quotation.customerPrice || 0;
  const messageCount = (quotation._count?.internalMessages || 0) + (quotation._count?.externalMessages || 0);
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-lg line-clamp-1">{quotation.title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{quotation.customer?.customname || quotation.customer?.name || '未填寫'}</span>
              </div>
              {quotation.project && (
                <div className="flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />
                  <span>{quotation.project.title}</span>
                </div>
              )}
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              $ {customerPrice.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>對話: {messageCount}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              更新: {format(new Date(quotation.updatedAt), 'MM/dd', { locale: zhTW })}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" className="ml-auto">
          查看詳情 →
        </Button>
      </CardFooter>
    </Card>
  );
}