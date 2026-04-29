// src/components/equipment/equipment-table.tsx

"use client";

import { api } from "@/utils/api";
import { useMemo } from "react";
import Link from "next/link"; // 👈 加入這行
export function EquipmentList() {
  const { data: equipment, isLoading } = api.equipment.getAll.useQuery();
  
  // ✅ 修正：使用 useUtils 來獲取工具函數
  const utils = api.useUtils();

  const deleteMutation = api.equipment.delete.useMutation({
    onSuccess: () => utils.equipment.getAll.invalidate(),
  });

  // 💰 計算總價值 (使用 useMemo 優化效能)
  // 💰 計算總價值 (使用 useMemo 優化效能)
  const totalValue = useMemo(() => {
    if (!equipment) return 0;
    return equipment.reduce((acc, item) => {
      // 這裡加一個 Number() 強制轉型，解決 Decimal 類型的問題
      const itemValue = item.value ? Number(item.value) : 0;
      return acc + itemValue;
    }, 0);
  }, [equipment]);


  if (isLoading) return <div className="p-8 text-center text-gray-500">載入資料中...</div>;
  if (!equipment?.length) return <div className="p-8 text-center text-gray-500">目前沒有器材資料，請新增一筆。</div>;

  return (
    <div className="space-y-4">
      {/* 📊 頂部統計卡片 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase">設備總數</p>
          <p className="text-2xl font-bold text-gray-900">{equipment.length} <span className="text-sm font-normal text-gray-400">台</span></p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase">資產總價值</p>
          <p className="text-2xl font-bold text-emerald-600">
            ${totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 📋 主要表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-semibold min-w-[180px]">設備名稱 / 型號</th>
                <th className="px-4 py-3 font-semibold w-[120px]">價值</th>
                <th className="px-4 py-3 font-semibold w-[180px]">專案 / 歸屬</th>
                <th className="px-4 py-3 font-semibold w-[160px]">狀態 / 期限</th>
                <th className="px-4 py-3 font-semibold text-right w-[80px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {equipment.map((item) => {
                const isRental = item.ownership === "EXTERNAL_RENTAL";
                
                // 計算剩餘天數 (如果是租借)
                let daysRemaining = null;
                let isOverdue = false;
                if (item.rentalDeadline) {
                  const today = new Date();
                  const deadline = new Date(item.rentalDeadline);
                  const diffTime = deadline.getTime() - today.getTime();
                  daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                  isOverdue = daysRemaining < 0;
                }

                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    
                    {/* 1. 名稱與詳細資訊 */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-base">
                              <Link 
                                href={`/equipment/${item.id}`} 
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                              >
                                {item.name}
                              </Link>
                          </span>
                        <div className="flex items-center gap-2 mt-1">
                          {item.model && (
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-mono">
                              {item.model}
                            </span>
                          )}
                          {item.serialNumber && (
                            <span className="text-gray-400 text-xs font-mono">
                              SN: {item.serialNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. 價值 (錢) */}
                    <td className="px-4 py-3 align-top font-medium text-gray-700">
                      {item.value ? (
                        <span>${item.value.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>

                    {/* 3. 項目 / 歸屬 (用在什麼項目) */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        {item.team ? (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 text-xs">歸屬:</span>
                            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-medium">
                              {item.team}
                            </span>
                          </div>
                        ) : <span className="text-gray-300 text-xs">- 未分派團隊 -</span>}

                        {item.notes && (
                          <div className="text-xs text-gray-500 mt-1 italic border-l-2 border-gray-200 pl-2">
                            "{item.notes}"
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 4. 狀態與時間 (使用日子) */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1.5">
                        {/* 狀態標籤 */}
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              item.status === "AVAILABLE" ? "bg-green-50 text-green-700 border-green-200" :
                              item.status === "IN_USE" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              item.status === "MAINTENANCE" ? "bg-orange-50 text-orange-700 border-orange-200" :
                              "bg-gray-100 text-gray-600 border-gray-200"
                            }`}>
                              {item.status === "AVAILABLE" && "可借用"}
                              {item.status === "IN_USE" && "使用中"}
                              {item.status === "MAINTENANCE" && "維修中"}
                              {item.status === "LOST" && "遺失"}
                            </span>
                        </div>

                        {/* 時間資訊 */}
                        {isRental ? (
                          <div className="bg-amber-50 border border-amber-100 rounded p-1.5">
                             <div className="text-xs text-amber-800 font-medium mb-0.5">外部租借</div>
                             {item.rentalDeadline ? (
                               <div className={`text-xs ${isOverdue ? "text-red-600 font-bold" : "text-amber-700"}`}>
                                 {isOverdue 
                                   ? `⚠️ 已過期 ${Math.abs(daysRemaining!)} 天` 
                                   : `⏳ 剩餘 ${daysRemaining} 天歸還`}
                                   <div className="text-[10px] text-amber-600/70 mt-0.5">
                                     ({new Date(item.rentalDeadline).toLocaleDateString()})
                                   </div>
                               </div>
                             ) : <span className="text-xs text-amber-600/50">無期限</span>}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 mt-1">
                             🏢 公司資產
                             {/* 如果你有 purchaseDate 欄位可以取消下面的註解顯示 */}
                             {/* {item.purchaseDate && <div>購入: {new Date(item.purchaseDate).toLocaleDateString()}</div>} */}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 5. 操作 */}
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        onClick={() => {
                          if (confirm(`確定要刪除 ${item.name} 嗎？`)) {
                            deleteMutation.mutate({ id: item.id });
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all"
                        title="刪除"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
