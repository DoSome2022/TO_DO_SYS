// src/components/equipment/equipment-table.tsx
"use client";

import { useState } from "react";
import { api } from "@/utils/api";
import { useMemo } from "react";
import Link from "next/link";
// import { EditEquipmentDialog } from "./EditEquipmentDialog";
// import { ScrapEquipmentDialog } from "./ScrapEquipmentDialog";
// import { ReturnEquipmentDialog } from "./ReturnEquipmentDialog";
import { toast } from "sonner";
import { Pencil, Trash2, RotateCcw, FileDown, AlertTriangle } from "lucide-react";
import { EditEquipmentDialog } from "./EditEquipmentDialog";
import { ScrapEquipmentDialog } from "./ScrapEquipmentDialog";
import { ReturnEquipmentDialog } from "./ReturnEquipmentDialog";

export function EquipmentList() {
  const { data: equipment, isLoading } = api.equipment.getAll.useQuery();
  const utils = api.useUtils();

  const deleteMutation = api.equipment.delete.useMutation({
    onSuccess: () => utils.equipment.getAll.invalidate(),
  });

  // ── 對話框狀態 ──
  const [editTarget, setEditTarget] = useState<any>(null);
  const [scrapTarget, setScrapTarget] = useState<any>(null);
  const [returnTarget, setReturnTarget] = useState<any>(null);

  // ── 匯出 PDF ──
  const handleExportPDF = async () => {
    try {
      // 動態導入 html2canvas + jsPDF
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const element = document.getElementById("equipment-table");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`設備清單_${new Date().toISOString().slice(0, 10)}.pdf`);

      toast.success("PDF 已匯出");
    } catch (error) {
      toast.error("PDF 匯出失敗，請確認已安裝 html2canvas 和 jspdf");
      console.error(error);
    }
  };

  const totalValue = useMemo(() => {
    if (!equipment) return 0;
    return equipment.reduce((acc, item) => {
      const itemValue = item.value ? Number(item.value) : 0;
      return acc + itemValue;
    }, 0);
  }, [equipment]);

  if (isLoading) return <div className="p-8 text-center text-gray-500">載入資料中...</div>;
  if (!equipment?.length) return <div className="p-8 text-center text-gray-500">目前沒有器材資料，請新增一筆。</div>;

  return (
    <div className="space-y-4">
      {/* 頂部統計卡片 + PDF 匯出按鈕 */}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 flex-1">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 font-medium uppercase">設備總數</p>
            <p className="text-2xl font-bold text-gray-900">
              {equipment.length} <span className="text-sm font-normal text-gray-400">台</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 font-medium uppercase">資產總價值</p>
            <p className="text-2xl font-bold text-emerald-600">
              ${totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 🆕 PDF 匯出按鈕 */}
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm ml-4"
        >
          <FileDown className="w-4 h-4" />
          匯出 PDF
        </button>
      </div>

      {/* 主要表格 — 加上 id 供 PDF 匯出使用 */}
      <div id="equipment-table" className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-semibold min-w-[180px]">設備名稱 / 型號</th>
                <th className="px-4 py-3 font-semibold w-[120px]">價值</th>
                <th className="px-4 py-3 font-semibold w-[180px]">設備分類</th>
                <th className="px-4 py-3 font-semibold w-[160px]">狀態</th>
                <th className="px-4 py-3 font-semibold text-right w-[140px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {equipment.map((item) => {
                // 找到當前誰借了（如果有）
                const currentLog = (item as any).logs?.[0];

                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <Link href={`/equipment/${item.id}`} className="text-blue-600 hover:text-blue-800 font-bold text-base">
                        {item.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {item.model && (
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-mono">{item.model}</span>
                        )}
                        {item.serialNumber && (
                          <span className="text-gray-400 text-xs font-mono">SN: {item.serialNumber}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-700">
                      {item.value ? <span>${item.value.toLocaleString()}</span> : <span className="text-gray-300">-</span>}
                    </td>

                    <td className="px-4 py-3">
                      {item.team ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{item.team}</span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                      {item.notes && <div className="text-xs text-gray-500 mt-1">"{item.notes}"</div>}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          item.status === "AVAILABLE" ? "bg-green-50 text-green-700 border-green-200" :
                          item.status === "IN_USE" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          item.status === "MAINTENANCE" ? "bg-orange-50 text-orange-700 border-orange-200" :
                          item.status === "RETIRED" ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-gray-100 text-gray-600 border-gray-200"
                        }`}>
                          {item.status === "AVAILABLE" && "可借用"}
                          {item.status === "IN_USE" && "使用中"}
                          {item.status === "MAINTENANCE" && "維修中"}
                          {item.status === "RETIRED" && "報廢"}
                          {item.status === "LOST" && "遺失"}
                        </span>

                        {/* 🆕 顯示借用者姓名 */}
                        {item.status === "IN_USE" && currentLog?.borrowedBy && (
                          <span className="text-xs text-gray-500">
                            借用者：{currentLog.borrowedBy.name}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* 🆕 編輯按鈕 */}
                        <button
                          onClick={() => setEditTarget(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="編輯"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* 🆕 歸還按鈕（只有使用中且當前用戶是借用者時顯示） */}
                        {item.status === "IN_USE" && currentLog?.borrowedBy?.id && (
                          <button
                            onClick={() => setReturnTarget(item)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                            title="歸還設備"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* 🆕 報廢按鈕（只有可用/維修中才能報廢） */}
                        {(item.status === "AVAILABLE" || item.status === "MAINTENANCE") && (
                          <button
                            onClick={() => setScrapTarget(item)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="報廢"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}

                        {/* 刪除按鈕（保留原有） */}
                        <button
                          onClick={() => {
                            if (confirm(`確定要刪除 ${item.name} 嗎？`)) {
                              deleteMutation.mutate({ id: item.id });
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🆕 編輯對話框 */}
      {editTarget && (
        <EditEquipmentDialog
          open={!!editTarget}
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          equipment={editTarget}
          onSuccess={() => {
            utils.equipment.getAll.invalidate();
            setEditTarget(null);
          }}
        />
      )}

      {/* 🆕 報廢對話框 */}
      {scrapTarget && (
        <ScrapEquipmentDialog
          open={!!scrapTarget}
          onOpenChange={(open) => { if (!open) setScrapTarget(null); }}
          equipment={scrapTarget}
          onSuccess={() => {
            utils.equipment.getAll.invalidate();
            setScrapTarget(null);
          }}
        />
      )}

      {/* 🆕 歸還對話框 */}
      {returnTarget && (
        <ReturnEquipmentDialog
          open={!!returnTarget}
          onOpenChange={(open) => { if (!open) setReturnTarget(null); }}
          equipment={returnTarget}
          onSuccess={() => {
            utils.equipment.getAll.invalidate();
            setReturnTarget(null);
          }}
        />
      )}
    </div>
  );
}
