"use client";

import { useState } from "react"; // 1. 記得引入 useState
import { Button } from "../ui/button";

interface ServiceTableProps {
  services: any[]; 
  isLoading: boolean;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

export function ServiceTable({ services, isLoading, onToggleActive, onDelete }: ServiceTableProps) {
  // 2. 定義分頁狀態與每頁筆數
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  if (isLoading) return <div>載入中...</div>;
  if (!services?.length) return <div>目前沒有服務項目</div>;

  // 3. 計算分頁邏輯
  const totalPages = Math.ceil(services.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  
  // 裁切出「當前頁面」該顯示的那 10 筆資料
  const currentData = services.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-4"> {/* 外層包一個 div 來放表格和按鈕 */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2">名稱</th>
            <th className="p-2">類型</th>
            <th className="p-2">價錢</th>
            <th className="p-2">狀態</th>
            <th className="p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {/* 4. 這裡把 services 改成 currentData，只 map 這 10 筆 */}
          {currentData.map((service) => (
            <tr key={service.id} className="border-b">
              <td className="p-2">{service.name}</td>
              <td className="p-2">{service.type}</td>
              <td className="p-2">${Number(service.price).toLocaleString()}</td>
              <td className="p-2">
                <span className={service.isActive ? "text-green-600" : "text-gray-400"}>
                  {service.isActive ? "上架中" : "已下架"}
                </span>
              </td>
              <td className="p-2 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onToggleActive(service.id, service.isActive)}
                >
                  {service.isActive ? "下架" : "上架"}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (confirm("確定要刪除嗎？")) onDelete(service.id);
                  }}
                >
                  刪除
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 5. 下方的分頁控制按鈕 (如果總頁數大於 1 頁才顯示) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-500">
            第 {currentPage} 頁 / 共 {totalPages} 頁 (總計 {services.length} 筆)
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1} // 第一頁時禁用上一頁
            >
              上一頁
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages} // 最後一頁時禁用下一頁
            >
              下一頁
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
