"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
interface AdminProjectTableProps {
  projects: any[]; 
  isLoading: boolean;
  onUpdateStatus: (id: string, newStatus: "IN_PROGRESS" | "COMPLETED" | "ON_HOLD") => void;
  // 👇 新增這個 Callback，用來處理上架/下架
  onTogglePublic: (id: string, isPublic: boolean) => void;
}
export function AdminProjectTable({ projects, isLoading, onUpdateStatus, onTogglePublic }: AdminProjectTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  if (isLoading) return <div className="p-4">載入中...</div>;
  if (!projects?.length) return <div className="p-4 text-muted-foreground">目前沒有專案資料。</div>;
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const currentData = projects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3">專案名稱</th>
              <th className="p-3">負責人</th>
              <th className="p-3">時程與天數</th>
              <th className="p-3">狀態</th>
              <th className="p-3">進度</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((project) => {
              let daysDiff = null;
              if (project.startDate && project.endDate) {
                const start = new Date(project.startDate);
                const end = new Date(project.endDate);
                daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              }
              return (
                <tr key={project.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">
                    {project.title}
                    {/* 如果已上架，給個小標籤提示 */}
                    {project.isPublicPortfolio && (
                      <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">已公開</span>
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    <div className="text-gray-900 dark:text-gray-100">PM: {project.pm?.name || "未指定"}</div>
                    <div className="text-gray-500">Sales: {project.sales?.name || "無"}</div>
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    <div>{project.startDate ? new Date(project.startDate).toLocaleDateString() : "未定"} 起</div>
                    {daysDiff !== null ? (
                      <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">共 {daysDiff} 天</span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      project.status === "COMPLETED" ? "bg-green-100 text-green-700" : 
                      project.status === "ON_HOLD" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="p-3 flex gap-2 flex-wrap">
                    {/* --- 還沒完成時顯示的按鈕 --- */}
                    {project.status !== "COMPLETED" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => onUpdateStatus(project.id, "COMPLETED")}>完成</Button>
                        {project.status !== "ON_HOLD" && (
                          <Button variant="secondary" size="sm" onClick={() => onUpdateStatus(project.id, "ON_HOLD")}>暫停</Button>
                        )}
                      </>
                    )}
                    {/* 👇 --- 完成後顯示的按鈕 --- */}
                    {project.status === "COMPLETED" && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => onUpdateStatus(project.id, "IN_PROGRESS")}>
                          返回開發中
                        </Button>
                        <Button 
                          variant={project.isPublicPortfolio ? "destructive" : "default"} 
                          size="sm" 
                          onClick={() => onTogglePublic(project.id, !project.isPublicPortfolio)}
                        >
                          {project.isPublicPortfolio ? "下架作品" : "上架展示"}
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">第 {currentPage} 頁 / 共 {totalPages} 頁</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>上一頁</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>下一頁</Button>
          </div>
        </div>
      )}
    </div>
  );
}
