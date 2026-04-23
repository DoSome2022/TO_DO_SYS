// components/sales/QuotationDetailClient.tsx
'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign, 
  MessageSquare, 
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Building2,
  User,
  Calendar,
  FileText,
  Building,
  Phone,
  MapPin,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast } from 'sonner';
import { trpc } from '../../../../trpc/client';

interface QuotationDetailClientProps {
  quotationId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function QuotationDetailClient({ quotationId, onClose, onRefresh }: QuotationDetailClientProps) {
  const [internalMessage, setInternalMessage] = useState('');
  const [externalMessage, setExternalMessage] = useState('');
  
  // 使用您的 getQuotationById API
  const { data: quotation, isLoading, refetch } = trpc.quotation.getQuotationById.useQuery(
    { id: quotationId },
    { enabled: !!quotationId }
  );
  
  // 如果有 companyProfileId，則獲取公司資料
  const { data: companyProfile } = trpc.companyProfile.getById.useQuery(
    { id: quotation?.companyProfileId || '' },
    { enabled: !!quotation?.companyProfileId }
  );
  
  // 使用您的 updateQuotationStatus API
  const updateStatus = trpc.quotation.updateQuotationStatus.useMutation({
    onSuccess: () => {
      refetch();
      onRefresh();
      toast.success('狀態已更新');
    },
    onError: (error) => {
      toast.error(error.message || '更新失敗');
    },
  });
  
  // 使用您的 sendInternalMessage API
  const sendInternal = trpc.quotation.sendInternalMessage.useMutation({
    onSuccess: () => {
      setInternalMessage('');
      refetch();
      toast.success('訊息已發送');
    },
    onError: (error) => {
      toast.error(error.message || '發送失敗');
    },
  });
  
  // 使用您的 sendExternalMessage API
  const sendExternal = trpc.quotation.sendExternalMessage.useMutation({
    onSuccess: () => {
      setExternalMessage('');
      refetch();
      toast.success('訊息已發送');
    },
    onError: (error) => {
      toast.error(error.message || '發送失敗');
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!quotation) {
    return <div className="text-center py-8 text-muted-foreground">報價單不存在</div>;
  }
  
  const handleSendInternal = async () => {
    if (!internalMessage.trim()) return;
    await sendInternal.mutateAsync({ quotationId, content: internalMessage });
  };
  
  const handleSendExternal = async () => {
    if (!externalMessage.trim()) return;
    await sendExternal.mutateAsync({ quotationId, content: externalMessage });
  };
  
  const statusConfig = {
    DRAFT: { label: '草稿', color: 'bg-gray-500', icon: null },
    NEGOTIATING: { label: '交涉中', color: 'bg-blue-500', icon: null },
    WON: { label: '已贏單', color: 'bg-green-500', icon: CheckCircle },
    LOST: { label: '已輸單', color: 'bg-red-500', icon: XCircle },
  };
  
  const status = statusConfig[quotation.status as keyof typeof statusConfig];
  const StatusIcon = status?.icon;
  
  // 計算對話數量
  const internalMessagesCount = quotation.internalMessages?.length || 0;
  const externalMessagesCount = quotation.externalMessages?.length || 0;
  
  return (
    <div className="space-y-6">
      {/* 標題與狀態 */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{quotation.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span>客戶：{quotation.customer?.customname || quotation.customer?.name || '未填寫'}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>業務：{quotation.sales?.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>建立：{format(new Date(quotation.createdAt), 'yyyy/MM/dd', { locale: zhTW })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* 只有非 WON/LOST 狀態才能更新 */}
          {quotation.status !== 'WON' && quotation.status !== 'LOST' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus.mutate({ quotationId, status: 'WON' })}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                標記為贏單
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus.mutate({ quotationId, status: 'LOST' })}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-1" />
                標記為輸單
              </Button>
            </>
          )}
          <Badge className={`${status.color} text-white px-3 py-1`}>
            {StatusIcon && <StatusIcon className="h-3 w-3 mr-1 inline" />}
            {status.label}
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="detail" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="detail">報價資訊</TabsTrigger>
          <TabsTrigger value="internal">
            內部對話
            {internalMessagesCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {internalMessagesCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="external">
            客戶對話
            {externalMessagesCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {externalMessagesCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* 報價資訊 */}
        <TabsContent value="detail" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                報價資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 顯示報價金額 */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">報價金額</p>
                    <p className="text-3xl font-bold text-primary">
                      $ {(quotation.customerPrice || 0).toLocaleString()}
                    </p>
                  </div>
                  <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
              </div>
              
              {/* 價格層級（如果有） */}
              {(quotation.baseCost || quotation.agreedCost || quotation.pmBudget) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">價格層級</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {quotation.baseCost && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">底線成本：</span>
                          <span>$ {Number(quotation.baseCost).toLocaleString()}</span>
                        </div>
                      )}
                      {quotation.agreedCost && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">內部成本：</span>
                          <span>NT$ {Number(quotation.agreedCost).toLocaleString()}</span>
                        </div>
                      )}
                      {quotation.pmBudget && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">PM預算：</span>
                          <span>$ {Number(quotation.pmBudget).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {/* 關聯專案 */}
              {quotation.project && (
                <>
                  <Separator />
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">關聯專案</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quotation.project.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      狀態: {quotation.project.status}
                    </p>
                  </div>
                </>
              )}
              
              {/* 公司抬頭資訊 - 使用 companyProfileId 查詢 */}
              {quotation.companyProfileId && companyProfile && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">公司抬頭資訊</p>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      {/* Logo 顯示 */}
                      {companyProfile.logoUrl && (
                        <div className="flex justify-center mb-3">
                          <img 
                            src={companyProfile.logoUrl} 
                            alt={companyProfile.name}
                            className="h-16 w-auto object-contain"
                          />
                        </div>
                      )}
                      
                      {/* 公司名稱 */}
                      <div>
                        <p className="text-sm font-semibold">{companyProfile.name}</p>
                      </div>
                      
                      {/* 統一編號 */}
                      {companyProfile.taxId && (
                        <div className="flex items-center gap-2 text-sm">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">統編：</span>
                          <span>{companyProfile.taxId}</span>
                        </div>
                      )}
                      
                      {/* 電話 */}
                      {companyProfile.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">電話：</span>
                          <span>{companyProfile.phone}</span>
                        </div>
                      )}
                      
                      {/* 地址 */}
                      {companyProfile.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground">地址：</span>
                          <span>{companyProfile.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {/* 如果只有 companyProfileId 但資料還在加載中 */}
              {quotation.companyProfileId && !companyProfile && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">載入公司資訊...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 內部對話 */}
        <TabsContent value="internal" className="mt-4">
          <Card className="h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                內部對話
                <Badge variant="outline" className="ml-2">僅 Admin/Sales 可見</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 h-[300px] pr-4">
                <div className="space-y-3">
                  {quotation.internalMessages && quotation.internalMessages.length > 0 ? (
                    quotation.internalMessages.map((msg: any) => (
                      <div key={msg.id} className="bg-muted p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">
                            {msg.sender?.name || '未知用戶'}
                            {msg.sender?.role && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({msg.sender.role})
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.createdAt), 'MM/dd HH:mm', { locale: zhTW })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      暫無內部對話，點擊下方輸入框開始對話
                    </p>
                  )}
                </div>
              </ScrollArea>
              
              <div className="mt-4 flex gap-2">
                <Textarea
                  placeholder="輸入內部訊息 (僅 Admin 和 Sales 可見)..."
                  value={internalMessage}
                  onChange={(e) => setInternalMessage(e.target.value)}
                  className="flex-1 resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendInternal();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendInternal} 
                  disabled={sendInternal.isPending || !internalMessage.trim()}
                  className="self-end"
                >
                  {sendInternal.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 外部對話 */}
        <TabsContent value="external" className="mt-4">
          <Card className="h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                客戶對話
                <Badge variant="outline" className="ml-2">Sales 與客戶溝通</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 h-[300px] pr-4">
                <div className="space-y-3">
                  {quotation.externalMessages && quotation.externalMessages.length > 0 ? (
                    quotation.externalMessages.map((msg: any) => {
                      const isSales = !!msg.senderUser;
                      return (
                        <div 
                          key={msg.id} 
                          className={`p-3 rounded-lg ${
                            isSales 
                              ? 'bg-blue-50 dark:bg-blue-950 ml-8' 
                              : 'bg-muted mr-8'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">
                              {isSales 
                                ? `${msg.senderUser?.name || '業務'} (業務)`
                                : msg.senderCustomer?.customname || msg.senderCustomer?.name || '客戶'
                              }
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.createdAt), 'MM/dd HH:mm', { locale: zhTW })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      暫無客戶對話，點擊下方輸入框開始與客戶溝通
                    </p>
                  )}
                </div>
              </ScrollArea>
              
              <div className="mt-4 flex gap-2">
                <Textarea
                  placeholder="回覆客戶..."
                  value={externalMessage}
                  onChange={(e) => setExternalMessage(e.target.value)}
                  className="flex-1 resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendExternal();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendExternal} 
                  disabled={sendExternal.isPending || !externalMessage.trim()}
                  className="self-end"
                >
                  {sendExternal.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}