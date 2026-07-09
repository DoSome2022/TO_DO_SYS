// app/projects/ProjectsClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Folder,
  MoreHorizontal,
  Clock,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  User,
  Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  progress: number;
  endDate?: Date | null;
  isArchived: boolean;
  customer?: {
    id: string;
    name?: string | null;
    customname?: string | null;
    companyname?: string | null;
  } | null;
  sales?: {
    id: string;
    name?: string | null;
    image?: string | null;
  } | null;
  pm?: {
    id: string;
    name?: string | null;
    image?: string | null;
  } | null;
}

interface Props {
  projects: Project[];
}

// 輔助函數：取得客戶顯示名稱
function getCustomerName(customer: Project['customer']): string {
  if (!customer) return "未指定客戶";
  return customer.companyname || customer.customname || customer.name || "未命名客戶";
}

export default function ProjectsClient({ projects }: Props) {
  // ── 狀態 ──
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [groupByCustomer, setGroupByCustomer] = useState(true);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(
    new Set()
  );

  // ── 過濾專案 ──
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      // 搜尋過濾
      if (search) {
        const q = search.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchCustomer = getCustomerName(p.customer).toLowerCase().includes(q);
        const matchSales = p.sales?.name?.toLowerCase().includes(q);
        const matchPm = p.pm?.name?.toLowerCase().includes(q);
        if (!matchTitle && !matchCustomer && !matchSales && !matchPm) {
          return false;
        }
      }

      // 歸檔過濾
      if (!showArchived && p.isArchived) {
        return false;
      }

      return true;
    });
  }, [projects, search, showArchived]);

  // ── 按客戶分組 ──
  const grouped = useMemo(() => {
    if (!groupByCustomer) return null;

    const map = new Map<string, Project[]>();
    for (const p of filtered) {
      const key = p.customer?.id || "__no_customer__";
      const label = getCustomerName(p.customer);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(p);
    }

    // 排序：有客戶的在前，未指定客戶的在最後
    return Array.from(map.entries()).sort(([keyA], [keyB]) => {
      if (keyA === "__no_customer__") return 1;
      if (keyB === "__no_customer__") return -1;
      return keyA.localeCompare(keyB);
    });
  }, [filtered, groupByCustomer]);

  // ── 展開/收合客戶群組 ──
  const toggleCustomer = (customerId: string) => {
    setExpandedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  // ── 統計資訊 ──
  const activeCount = projects.filter((p) => !p.isArchived).length;
  const archivedCount = projects.filter((p) => p.isArchived).length;

  return (
    <div className="space-y-6">
      {/* ── 工具列 ── */}
      <div className="flex flex-wrap items-center gap-4">
        {/* 搜尋 */}
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜尋專案名稱、客戶、負責人..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 分組開關 */}
        <Select
          value={groupByCustomer ? "customer" : "none"}
          onValueChange={(v) => setGroupByCustomer(v === "customer")}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="檢視模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer">依客戶分組</SelectItem>
            <SelectItem value="none">全部列表</SelectItem>
          </SelectContent>
        </Select>

        {/* 顯示隱藏專案 */}
        <Button
          variant={showArchived ? "default" : "outline"}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          className="gap-2"
        >
          {showArchived ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
          已歸檔 ({archivedCount})
        </Button>
      </div>

      {/* ── 統計列 ── */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>
          共 <strong>{filtered.length}</strong> 個專案
        </span>
        <span>
          進行中 <strong>{activeCount}</strong>
        </span>
        <span>
          已歸檔 <strong>{archivedCount}</strong>
        </span>
      </div>

      {/* ── 空狀態 ── */}
      {filtered.length === 0 && (
        <div className="text-center py-20 bg-gray-50 border border-dashed rounded-xl">
          <p className="text-gray-500 text-lg">
            {search ? "無符合條件的專案" : "目前沒有任何專案"}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {search ? "嘗試修改搜尋關鍵字" : "點擊右上方按鈕建立您的第一個專案"}
          </p>
        </div>
      )}

      {/* ── 依客戶分組模式 ── */}
      {groupByCustomer && grouped ? (
        <div className="space-y-6">
          {grouped.map(([customerId, customerProjects]) => {
            const customerName =
              customerId === "__no_customer__"
                ? "未指定客戶"
                : getCustomerName(customerProjects[0]?.customer);
            const isExpanded = expandedCustomers.has(customerId);

            return (
              <div
                key={customerId}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* 客戶標題列 */}
                <div
                  className="flex items-center justify-between px-5 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => toggleCustomer(customerId)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {customerName}
                    </span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {customerProjects.length}
                    </Badge>
                  </div>
                </div>

                {/* 客戶底下的專案列表 */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {customerProjects.map((project) => (
                      <ProjectCardItem
                        key={project.id}
                        project={project}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── 全部列表模式 ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <ProjectCardItem key={project.id} project={project} cardMode />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 專案卡片/列表項目元件
// ==========================================
function ProjectCardItem({
  project,
  cardMode = false,
}: {
  project: Project;
  cardMode?: boolean;
}) {
  const content = (
    <div
      className={`${
        cardMode
          ? "bg-white border border-gray-200 rounded-md p-5 hover:shadow-md transition-shadow"
          : "px-5 py-4 hover:bg-gray-50 transition flex items-center"
      } ${project.isArchived ? "opacity-60" : ""} relative`}
    >
      {/* 主要內容 */}
      <div className={cardMode ? "" : "flex-1 min-w-0"}>
        <div className="flex items-center gap-2">
          <Folder
            className={`w-5 h-5 ${
              project.isArchived ? "text-gray-400" : "text-blue-600"
            } shrink-0`}
          />
          <h3
            className={`font-semibold ${
              cardMode ? "text-lg" : "text-base"
            } text-gray-900 truncate`}
          >
            {project.title}
          </h3>
          {project.isArchived && (
            <Badge
              variant="outline"
              className="text-[10px] text-gray-400 border-gray-200"
            >
              已歸檔
            </Badge>
          )}
        </div>

        {/* 客戶 + 負責人資訊 */}
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
          {project.customer && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {getCustomerName(project.customer)}
            </span>
          )}
          {project.sales && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Sales: {project.sales.name}
            </span>
          )}
          {project.pm && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              PM: {project.pm.name}
            </span>
          )}
        </div>

        {cardMode && project.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 mt-2">
            {project.description}
          </p>
        )}

        {/* 進度條 */}
        {cardMode && (
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-xs text-gray-600 font-medium">
              <span>專案進度</span>
              <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 截止日 */}
        <div
          className={`flex items-center text-xs text-gray-500 ${
            cardMode ? "border-t border-gray-100 pt-3 mt-2" : ""
          }`}
        >
          <Clock className="w-3.5 h-3.5 mr-1" />
          <span>
            截止日:{" "}
            {project.endDate
              ? new Date(project.endDate).toLocaleDateString()
              : "未設定"}
          </span>
        </div>
      </div>

      {/* 操作選單 */}
      {!cardMode && (
        <ProjectActions project={project} />
      )}
    </div>
  );

  if (cardMode) {
    return (
      <Link href={`/projects/${project.id}`} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}

// ==========================================
// 專案操作選單（隱藏/取消隱藏）
// ==========================================
function ProjectActions({ project }: { project: Project }) {
  const [isArchived, setIsArchived] = useState(project.isArchived);

  const handleToggleArchive = async () => {
    try {
      // 使用 tRPC 或 fetch 呼叫 API
      const res = await fetch(`/api/projects/${project.id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !isArchived }),
      });
      if (res.ok) {
        setIsArchived(!isArchived);
        // 刷新頁面
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to toggle archive", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-gray-400 hover:text-gray-600 ml-4">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => window.location.href = `/projects/${project.id}`}>
          <Folder className="w-4 h-4 mr-2" />
          查看詳情
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleToggleArchive}>
          {isArchived ? (
            <>
              <Eye className="w-4 h-4 mr-2" />
              取消歸檔
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              歸檔專案
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
