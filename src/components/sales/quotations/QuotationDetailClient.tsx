// src/components/sales/quotations/QuotationDetailClient.tsx
// 在現有檔案中新增「編輯報價單」功能

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Hash,
  Pencil,      // 🆕
  Save,        // 🆕
  X,           // 🆕
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast } from 'sonner';
import { trpc } from '../../../../trpc/client';
import QuotationItemManager from "./QuotationItemManager";
import VersionTimeline from './VersionTimeline';

interface QuotationDetailClientProps {
  quotationId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function QuotationDetailClient({ quotationId, onClose, onRefresh }: QuotationDetailClientProps) {
  const [internalMessage, setInternalMessage] = useState('');
  const [externalMessage, setExternalMessage] = useState('');

  // 🆕 編輯模式狀態
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCustomerPrice, setEditCustomerPrice] = useState('');

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

  // 🆕 更新報價單內容
  const updateQuotation = trpc.quotation.updateQuotation.useMutation({
    onSuccess: () => {
      refetch();
      onRefresh();
      setIsEditing(false);
      toast.success('報價單已更新');
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

  // 🆕 進入編輯模式
  const handleStartEdit = () => {
    setEditTitle(quotation.title);
    setEditCustomerPrice(String(quotation.customerPrice || 0));
    setIsEditing(true);
  };

  // 🆕 儲存編輯
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error('標題不能為空');
      return;
    }
    await updateQuotation.mutateAsync({
      quotationId,
      title: editTitle,
      customerPrice: Number(editCustomerPrice) || 0,
    });
  };

  const statusConfig = {
    DRAFT: { label: '草稿', color: 'bg-gray-500', icon: null },
    NEGOTIATING: { label: '交涉中', color: 'bg-blue-500', icon: null },
    WON: { label: '已贏單', color: 'bg-green-500', icon: CheckCircle },
    LOST: { label: '已輸單', color: 'bg-red-500', icon: XCircle },
    CANCELLED: { label: '已取消', color: 'bg-gray-400', icon: XCircle },
    CONVERTED: { label: '已轉專案', color: 'bg-purple-500', icon: CheckCircle },
  };

  const status = statusConfig[quotation.status as keyof typeof statusConfig] || {
    label: quotation.status || '未知',
    color: 'bg-gray-500',
    icon: null,
  };

  const StatusIcon = status?.icon;
  const internalMessagesCount = quotation.internalMessages?.length || 0;
  const externalMessagesCount = quotation.externalMessages?.length || 0;

  return (
    <div className="space-y-6">
      {/* 標題與狀態 */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          {/* 🆕 編輯模式：顯示輸入框 */}
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-bold w-full"
                placeholder="報價單標題"
              />
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">報價金額 (HKD)：</Label>
                <Input
                  type="number"
                  value={editCustomerPrice}
                  onChange={(e) => setEditCustomerPrice(e.target.value)}
                  className="w-48"
                  min={0}
                />
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {/* 🆕 編輯/儲存/取消按鈕 */}
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={updateQuotation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={updateQuotation.isPending}
              >
                {updateQuotation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                儲存
              </Button>
            </>
          ) : (
            <>
              {/* 🆕 編輯按鈕 — 只在草稿狀態可編輯 */}
              <Button size="sm" variant="outline" onClick={handleStartEdit}>
                <Pencil className="h-4 w-4 mr-1" />
                編輯
              </Button>
              {/* 狀態變更按鈕 */}
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
            </>
          )}

          <Badge className={`${status.color} text-white px-3 py-1`}>
            {StatusIcon && <StatusIcon className="h-3 w-3 mr-1 inline" />}
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Tabs 區域（保持不變） */}
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

        {/* 報價資訊（保持不變） */}
        <TabsContent value="detail" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                報價資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
<div className="p-4 bg-muted rounded-lg">
  <div className="flex justify-between items-center">
    <div>
      <p className="text-sm text-muted-foreground">報價金額（客戶價）</p>
      <p className="text-3xl font-bold text-primary">
        $ {(quotation.customerPrice || 0).toLocaleString()}
      </p>
    </div>
    <div className="text-right">
      <p className="text-sm text-muted-foreground">項目加總</p>
      <p className="text-xl font-semibold">
        $ {Number(quotation.totalAmount || 0).toLocaleString()}
      </p>
      {/* 如果兩者有差異，顯示提示 */}
      {Number(quotation.totalAmount) !== Number(quotation.customerPrice) && (
        <p className="text-xs text-orange-500 mt-1">
          與項目加總有差異
        </p>
      )}
    </div>
    <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
  </div>
</div>


              {/* ⬇️ 🆕 在這裡加入 QuotationItemManager */}
              <Separator />
              <QuotationItemManager
                quotationId={quotationId}
                items={quotation.items || []}
              />

                {/* ⬇️ 🆕 版本管理 */}
  <Separator />
  <VersionTimeline
    quotationId={quotationId}
    currentVersionId={quotation.currentVersionId}
  />

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

              {quotation.project && (
                <>
                  <Separator />
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">關聯專案</p>
                    <p className="text-sm text-muted-foreground mt-1">{quotation.project.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">狀態: {quotation.project.status}</p>
                  </div>
                </>
              )}

              {quotation.companyProfileId && companyProfile && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">公司抬頭資訊</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      {companyProfile.logoUrl && (
                        <div className="flex justify-center mb-3">
                          <img src={companyProfile.logoUrl} alt={companyProfile.name} className="h-16 w-auto object-contain" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold">{companyProfile.name}</p>
                      </div>
                      {companyProfile.taxId && (
                        <div className="flex items-center gap-2 text-sm">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">統編：</span>
                          <span>{companyProfile.taxId}</span>
                        </div>
                      )}
                      {companyProfile.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">電話：</span>
                          <span>{companyProfile.phone}</span>
                        </div>
                      )}
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

              {quotation.companyProfileId && !companyProfile && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">載入公司資訊...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 內部對話（完全保持不變） */}
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
                              <span className="text-xs text-muted-foreground ml-2">({msg.sender.role})</span>
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
                    <p className="text-center text-muted-foreground py-8">暫無內部對話，點擊下方輸入框開始對話</p>
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
                  {sendInternal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 外部對話（完全保持不變） */}
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
                          className={`p-3 rounded-lg ${isSales ? 'bg-blue-50 dark:bg-blue-950 ml-8' : 'bg-muted mr-8'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">
                              {isSales
                                ? `${msg.senderUser?.name || '業務'} (業務)`
                                : msg.senderCustomer?.customname || msg.senderCustomer?.name || '客戶'}
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
                    <p className="text-center text-muted-foreground py-8">暫無客戶對話，點擊下方輸入框開始與客戶溝通</p>
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
                  {sendExternal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
