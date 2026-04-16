// app/projects/[projectId]/_components/EmployeeWorkPool.tsx
"use client";


import { User, FileCode2, ArrowRightCircle } from "lucide-react";
import { useMemo } from "react";
import { trpc } from "../../../../../trpc/client";

export default function EmployeeWorkPool({ projectId }: { projectId: string }) {
  // 取得尚未被綁定到任何 Phase 的 WorkVersion
  const { data: unassignedVersions, isLoading } = trpc.WorkVersion.getUnassignedVersions.useQuery({ projectId });

  // 將版本依照員工分組 (Group by User)
  const groupedByUser = useMemo(() => {
    if (!unassignedVersions) return {};
    return unassignedVersions.reduce((acc, curr) => {
      const userName = curr.user?.name || "未知員工";
      if (!acc[userName]) acc[userName] = [];
      acc[userName].push(curr);
      return acc;
    }, {} as Record<string, typeof unassignedVersions>);
  }, [unassignedVersions]);

  if (isLoading) return <div className="text-sm text-gray-500 p-4">載入資源池中...</div>;

  return (
    <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">團隊產出池 (待審核)</h2>
      
      {Object.keys(groupedByUser).length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded border border-dashed">
          目前沒有尚未分配的成品。
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByUser).map(([userName, versions]) => (
            <div key={userName} className="space-y-3">
              {/* 員工標題 */}
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 p-2 rounded">
                <User className="w-4 h-4 text-blue-600" />
                {userName} 的提交
              </div>
              
              {/* 該員工的版本列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                {versions.map(version => (
                  <div key={version.id} className="flex justify-between items-start p-3 border border-gray-200 rounded bg-white hover:border-blue-300 transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-sm text-gray-900">
                        <FileCode2 className="w-4 h-4 text-gray-400" />
                        {version.versionName}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{version.note || '無備註'}</p>
                    </div>
                    {/* PM 可以點擊按鈕，將此版本分配給特定的 Phase (實作時可搭配 Dialog 或 Modal 選擇 Phase) */}
                    <button className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                      挑選 <ArrowRightCircle className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
