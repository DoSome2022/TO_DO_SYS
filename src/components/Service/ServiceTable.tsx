// src/components/Service/ServiceTable.tsx
"use client";

import { useState, useMemo } from "react"; // 🆕 加入 useMemo
import { Button } from "../ui/button";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"; // 🆕 排序圖示

interface ServiceTableProps {
  services: any[];
  isLoading: boolean;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

// 🆕 排序方向型別
type SortField = "name" | "price";
type SortDirection = "asc" | "desc";

export function ServiceTable({ services, isLoading, onToggleActive, onDelete }: ServiceTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // 🆕 排序狀態
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // 🆕 切換排序
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      // 同一個欄位：切換升降序
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      // 不同欄位：預設升序
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 🆕 排序圖示
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 inline ml-1 text-muted-foreground" />;
    return sortDirection === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 inline ml-1 text-blue-600" />
      : <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-blue-600" />;
  };

  // 🆕 排序後的資料（用 useMemo 避免每次 render 都重新排序）
  const sortedServices = useMemo(() => {
    if (!services) return [];

    const sorted = [...services].sort((a, b) => {
      let comparison = 0;

      if (sortField === "name") {
        comparison = (a.name || "").localeCompare(b.name || "", "zh-HK");
      } else if (sortField === "price") {
        comparison = (Number(a.price) || 0) - (Number(b.price) || 0);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [services, sortField, sortDirection]);

  if (isLoading) return <div>載入中...</div>;
  if (!services?.length) return <div>目前沒有服務項目</div>;

  // 分頁邏輯
  const totalPages = Math.ceil(sortedServices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = sortedServices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            {/* 🆕 名稱欄 — 可點擊排序 */}
            <th
              className="p-2 cursor-pointer select-none hover:bg-muted/50 transition"
              onClick={() => toggleSort("name")}
            >
              <span className="flex items-center">
                名稱
                <SortIcon field="name" />
              </span>
            </th>
            <th className="p-2">類型</th>
            {/* 🆕 價錢欄 — 可點擊排序 */}
            <th
              className="p-2 cursor-pointer select-none hover:bg-muted/50 transition"
              onClick={() => toggleSort("price")}
            >
              <span className="flex items-center">
                價錢
                <SortIcon field="price" />
              </span>
            </th>
            <th className="p-2">狀態</th>
            <th className="p-2">操作</th>
          </tr>
        </thead>
        <tbody>
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

      {/* 分頁控制 */}
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
              disabled={currentPage === 1}
            >
              上一頁
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              下一頁
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
