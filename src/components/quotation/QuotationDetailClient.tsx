// src/components/quotation/QuotationDetailClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "../../../trpc/client";
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  TrendingUp,
  DollarSign,
  Hash
} from "lucide-react";

type QuotationDetailClientProps = {
  quotationId: string;
  projectId: string;
  projectTitle: string;
};

export default function QuotationDetailClient({ 
  quotationId, 
  projectId, 
  projectTitle 
}: QuotationDetailClientProps) {
  const router = useRouter();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // 獲取報價單詳細資料
  const { data: quotation, isLoading, refetch } = trpc.quotation.getQuotationDetail.useQuery({
    quotationId,
    projectId,
  }, {
    enabled: !!quotationId && !!projectId,
  });

  // 切換版本
  const { mutate: switchVersion, isPending: isSwitching } = trpc.quotation.switchQuotationVersion.useMutation({
    onSuccess: (data) => {
      toast.success(`已切換至版本 ${data.versionNumber}`);
      refetch();
    },
    onError: (error) => {
      toast.error(`切換失敗：${error.message}`);
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // 實作下載 PDF 功能
    toast.info("下載功能開發中");
  };

  const handleVersionSwitch = (versionId: string) => {
    if (selectedVersionId === versionId) return;
    setSelectedVersionId(versionId);
    switchVersion({
      quotationId,
      versionId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">載入報價單中...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">找不到報價單資料</p>
        <button
          onClick={handleBack}
          className="mt-4 text-blue-600 hover:underline"
        >
          返回專案列表
        </button>
      </div>
    );
  }

  const currentVersion = quotation.versions.find(v => v.id === quotation.currentVersionId);
  const statusConfig = {
    DRAFT: { label: "草稿", className: "bg-gray-100 text-gray-800" },
    NEGOTIATING: { label: "交涉中", className: "bg-yellow-100 text-yellow-800" },
    WON: { label: "已成交", className: "bg-green-100 text-green-800" },
    LOST: { label: "已失效", className: "bg-red-100 text-red-800" },
  };
  const status = statusConfig[quotation.status as keyof typeof statusConfig] || statusConfig.DRAFT;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 頂部導航列 */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <Printer className="w-4 h-4" />
            列印
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            下載 PDF
          </button>
        </div>
      </div>

      {/* 報價單主體 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none">
        {/* 報價單標題區 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{quotation.title}</h1>
              <div className="flex items-center gap-3 text-sm text-blue-100">
                <span>報價單編號：{quotation.id.slice(0, 8).toUpperCase()}</span>
                <span>|</span>
                <span>建立日期：{new Date(quotation.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
                {status.label}
              </span>
              <p className="text-sm text-blue-100 mt-2">
                專案：{projectTitle}
              </p>
            </div>
          </div>
        </div>

        {/* 公司資訊 */}
        {quotation.companyProfile && (
          <div className="px-8 py-4 border-b bg-gray-50">
            <div className="flex items-center gap-4">
              {quotation.companyProfile.logoUrl && (
                <img 
                  src={quotation.companyProfile.logoUrl} 
                  alt="公司Logo" 
                  className="h-12 w-auto object-contain"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{quotation.companyProfile.name}</h3>
                {quotation.companyProfile.address && (
                  <p className="text-sm text-gray-500">{quotation.companyProfile.address}</p>
                )}
                <div className="flex gap-4 mt-1 text-xs text-gray-400">
                  {quotation.companyProfile.phone && <span>電話：{quotation.companyProfile.phone}</span>}
                  {quotation.companyProfile.taxId && <span>統編：{quotation.companyProfile.taxId}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 版本切換器 */}
        {quotation.versions.length > 1 && (
          <div className="px-8 py-4 border-b bg-yellow-50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-700" />
                <span className="text-sm font-medium text-yellow-800">版本記錄：</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {quotation.versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => handleVersionSwitch(version.id)}
                    disabled={isSwitching}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      version.id === quotation.currentVersionId
                        ? "bg-yellow-600 text-white font-medium"
                        : "bg-white border border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    }`}
                  >
                    v{version.versionNumber}
                    {version.isLatest && (
                      <span className="ml-1 text-xs opacity-80">(最新)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {currentVersion?.notes && (
              <p className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                📝 版本備註：{currentVersion.notes}
              </p>
            )}
          </div>
        )}

        {/* 報價內容 */}
        <div className="px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">報價明細</h2>
          
          {/* 報價表格 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">項目</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-700">數量</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-700">單價</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-700">小計</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 px-2">
                      <div className="font-medium text-gray-900">
                        {item.customName || item.service.name}
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="text-right py-3 px-2 text-gray-600">
                      $ {item.unitPrice.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-2 font-medium text-gray-900">
                      $ {item.subtotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="text-right py-4 px-2 font-semibold text-gray-900">
                    總金額：
                  </td>
                  <td className="text-right py-4 px-2">
                    <span className="text-xl font-bold text-blue-600">
                      $ {quotation.totalAmount.toLocaleString()}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 價格說明 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">價格說明</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>報價金額：</span>
                <span className="font-medium">$ {quotation.customerPrice?.toLocaleString() || '未設定'}</span>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                * 以上價格均為新台幣，不含營業稅
              </div>
              <div className="text-xs text-gray-400">
                * 有效期限：30 天內
              </div>
            </div>
          </div>
        </div>

        {/* 底部備註 */}
        <div className="px-8 py-4 border-t bg-gray-50 text-xs text-gray-500">
          <p>此報價單為正式商業文件，請妥善保存。</p>
          <p className="mt-1">如有任何問題，請聯繫您的專屬業務。</p>
        </div>
      </div>
    </div>
  );
}