// components/sales/QuotationListClient.tsx
'use client';

import { useState } from 'react';
import { QuotationCard } from './QuotationCard';
import { QuotationDetailClient } from './QuotationDetailClient';
import { CreateQuotationDialog } from './CreateQuotationDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { trpc } from '../../../../trpc/client';

type TabStatus = 'ALL' | 'DRAFT' | 'NEGOTIATING' | 'WON' | 'LOST';

export function QuotationListClient() {
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabStatus>('ALL');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { data: quotationsData, isLoading, refetch } = trpc.quotation.getSalesQuotations.useQuery();
  const quotations = quotationsData || [];
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  const filteredQuotations = activeTab === 'ALL' 
    ? quotations 
    : quotations.filter(q => q.status === activeTab);
  
  const statusCounts = {
    ALL: quotations.length,
    DRAFT: quotations.filter(q => q.status === 'DRAFT').length,
    NEGOTIATING: quotations.filter(q => q.status === 'NEGOTIATING').length,
    WON: quotations.filter(q => q.status === 'WON').length,
    LOST: quotations.filter(q => q.status === 'LOST').length,
  };
  
  return (
    <>
      <div className="space-y-6">
        {/* 標題列與新增按鈕 */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">報價單</h2>
            <p className="text-muted-foreground mt-1">
              管理您所有專案的報價單，追蹤每個案件的進度
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增報價單
          </Button>
        </div>
        
        {/* 狀態標籤頁 - 改良版 */}
        <Tabs defaultValue="ALL" value={activeTab} onValueChange={(v) => setActiveTab(v as TabStatus)}>
          {/* 使用 flex-wrap 讓標籤在移動設備上自動換行 */}
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            <TabsTrigger 
              value="ALL" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              全部 ({statusCounts.ALL})
            </TabsTrigger>
            {/* <TabsTrigger 
              value="DRAFT"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              草稿 ({statusCounts.DRAFT})
            </TabsTrigger>
            <TabsTrigger 
              value="NEGOTIATING"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              交涉中 ({statusCounts.NEGOTIATING})
            </TabsTrigger> */}
            <TabsTrigger 
              value="WON"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              已贏單 ({statusCounts.WON})
            </TabsTrigger>
            <TabsTrigger 
              value="LOST"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              已輸單 ({statusCounts.LOST})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {filteredQuotations.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">暫無報價單</p>
                <Button 
                  variant="link" 
                  onClick={() => setCreateDialogOpen(true)}
                  className="mt-2"
                >
                  點此建立第一張報價單
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuotations.map((quotation) => (
                  <QuotationCard
                    key={quotation.id}
                    quotation={quotation}
                    onClick={() => setSelectedQuotationId(quotation.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* 建立報價單對話框 - 提高 z-index 確保不被遮擋 */}
      <CreateQuotationDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => refetch()}
      />
      
      {/* 報價單詳情對話框 - 提高 z-index */}
      <Dialog open={!!selectedQuotationId} onOpenChange={() => setSelectedQuotationId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle>報價單詳情</DialogTitle>
          </DialogHeader>
          {selectedQuotationId && (
            <QuotationDetailClient 
              quotationId={selectedQuotationId} 
              onClose={() => setSelectedQuotationId(null)}
              onRefresh={refetch}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}