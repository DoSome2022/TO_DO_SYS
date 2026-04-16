"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Trophy,
  DollarSign,
  FolderOpen,
  Users,
  TrendingUp,
  Target,
  Clock,
} from "lucide-react";

interface SalesStatsCardsProps {
  stats?: {
    quotationsCount: number;
    wonQuotationsCount: number;
    totalQuotationValue: number;
    projectsCount: number;
    activeProjectsCount: number;
    customersCount: number;
    winRate: number;
  };
}

export default function SalesStatsCards({ stats }: SalesStatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const mainCards = [
    {
      title: "總報價單",
      value: stats.quotationsCount,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: stats.quotationsCount > 0 ? "+12%" : "0%",
      trendUp: true,
    },
    {
      title: "成交率",
      value: `${stats.winRate.toFixed(1)}%`,
      icon: Target,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      subValue: `${stats.wonQuotationsCount} / ${stats.quotationsCount} 件成交`,
      trend: stats.winRate > 50 ? "高於平均" : "低於平均",
      trendUp: stats.winRate > 50,
    },
    {
      title: "成交總額",
      value: `$${stats.totalQuotationValue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      trend: "+23%",
      trendUp: true,
    },
    {
      title: "進行中專案",
      value: stats.activeProjectsCount,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      subValue: `共 ${stats.projectsCount} 件專案`,
      trend: stats.activeProjectsCount > 0 ? "進行中" : "無進行中專案",
      trendUp: stats.activeProjectsCount > 0,
    },
  ];

  const secondaryCards = [
    {
      title: "總專案數",
      value: stats.projectsCount,
      icon: FolderOpen,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "客戶數",
      value: stats.customersCount,
      icon: Users,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },
    {
      title: "成交訂單",
      value: stats.wonQuotationsCount,
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "平均成交額",
      value: stats.wonQuotationsCount > 0 
        ? `$${(stats.totalQuotationValue / stats.wonQuotationsCount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : "$0",
      icon: TrendingUp,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 主要統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`${card.bgColor} p-2 rounded-full`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.subValue && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subValue}
                </p>
              )}
              {card.trend && (
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className={`text-xs ${
                      card.trendUp ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {card.trend}
                  </span>
                  {card.trendUp ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingUp className="w-3 h-3 text-red-600 transform rotate-180" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 次要統計卡片 - 可選，用於顯示更多數據 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryCards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`${card.bgColor} p-1.5 rounded-full`}>
                <card.icon className={`w-3 h-3 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}