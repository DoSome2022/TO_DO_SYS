"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Calendar,
  User,
  FolderOpen,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

// ✅ 修正 Project 介面，讓 customer.name 可以是 null
interface Project {
  id: string;
  title: string;
  status: string;
  customerPrice: number | null;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  pendingWorkItems: number;
  customer: {
    id: string;
    name: string | null;  // ✅ 改為 string | null
    companyname: string | null;
  } | null;  // ✅ customer 本身也可能是 null
  pm: {
    id: string;
    name: string | null;  // ✅ 改為 string | null
  } | null;
  phases?: Array<{ id: string; status: string }>;
  workItems?: Array<{ id: string }>;
}

interface SalesProjectsListProps {
  projects: Project[];
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  IN_PROGRESS: {
    label: "進行中",
    variant: "default",
    icon: <Clock className="w-3 h-3 mr-1" />,
  },
  COMPLETED: {
    label: "已完成",
    variant: "outline",
    icon: <CheckCircle className="w-3 h-3 mr-1" />,
  },
  ON_HOLD: {
    label: "暫停",
    variant: "secondary",
    icon: <AlertCircle className="w-3 h-3 mr-1" />,
  },
  CANCELLED: {
    label: "已取消",
    variant: "destructive",
    icon: <AlertCircle className="w-3 h-3 mr-1" />,
  },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "IN_PROGRESS":
      return "border-blue-200 bg-blue-50";
    case "COMPLETED":
      return "border-green-200 bg-green-50";
    case "ON_HOLD":
      return "border-yellow-200 bg-yellow-50";
    default:
      return "border-gray-200 bg-gray-50";
  }
};

export default function SalesProjectsList({ projects }: SalesProjectsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <FolderOpen className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">暫無關聯專案</p>
            <p className="text-sm text-muted-foreground">
              當報價單成交後，專案會自動出現在這裡
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.customer?.companyname || project.customer?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">我的專案列表</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 搜尋和過濾 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋專案名稱或客戶..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              全部 ({projects.length})
            </Button>
            {Object.entries(statusConfig).map(([key, config]) => (
              statusCounts[key] > 0 && (
                <Button
                  key={key}
                  variant={statusFilter === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(key)}
                >
                  {config.icon}
                  {config.label} ({statusCounts[key]})
                </Button>
              )
            ))}
          </div>
        </div>

        {/* 專案列表 */}
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${getStatusColor(
                project.status
              )}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* 左側：專案基本資訊 */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {project.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          客戶：{project.customer?.companyname || project.customer?.name || "未指定"}
                        </span>
                        {project.pm && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            PM：{project.pm.name || "未指派"}
                          </span>
                        )}
                        {project.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            開始：{format(new Date(project.startDate), "yyyy/MM/dd", { locale: zhTW })}
                          </span>
                        )}
                        {project.endDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            截止：{format(new Date(project.endDate), "yyyy/MM/dd", { locale: zhTW })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={statusConfig[project.status]?.variant}>
                      {statusConfig[project.status]?.icon}
                      {statusConfig[project.status]?.label}
                    </Badge>
                  </div>

                  {/* 進度條 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>專案進度</span>
                      <span className="font-medium">{project.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {/* 統計數據 */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">階段數</p>
                        <p className="font-medium">{project.phases?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">待辦事項</p>
                        <p className="font-medium text-amber-600">
                          {project.pendingWorkItems}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">專案金額</p>
                        <p className="font-medium">
                          ${project.customerPrice?.toLocaleString() || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 右側：操作按鈕 */}
                <div className="flex flex-row lg:flex-col gap-2">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/projects/${project.id}`}>
                      <ExternalLink className="w-4 h-4 mr-1" />
                      查看詳情
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="w-full">
                    <Link href={`/projects/${project.id}/timeline`}>
                      <Calendar className="w-4 h-4 mr-1" />
                      時程表
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            沒有符合條件的專案
          </div>
        )}
      </CardContent>
    </Card>
  );
}