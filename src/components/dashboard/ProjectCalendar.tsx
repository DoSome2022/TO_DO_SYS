// components/dashboard/ProjectCalendar.tsx
"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { trpc } from "@root/trpc/client";

// ─── 顏色對照表（依角色） ───
const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-300" },
  PM:    { bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-700 dark:text-blue-300",    border: "border-blue-300" },
  SALES: { bg: "bg-green-100 dark:bg-green-900/30",  text: "text-green-700 dark:text-green-300",  border: "border-green-300" },
  STAFF: { bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-300",  border: "border-amber-300" },
};

const priorityColors: Record<string, string> = {
  HIGH:   "border-l-red-500",
  MEDIUM: "border-l-yellow-500",
  LOW:    "border-l-gray-400",
};

export default function ProjectCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

  // ── 取得行事曆資料 ──
  const { data, isLoading } = trpc.calendar.getEvents.useQuery({
    year: currentYear,
    month: currentMonth,
  });

  // ── 計算月曆格子 ──
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startDayOfWeek = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];
    // 補齊前月空白
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    // 本月日期
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [currentYear, currentMonth]);

  // ── 將專案 mapping 到每一天 ──
  const projectMap = useMemo(() => {
    const map: Record<number, any[]> = {};
    if (!data?.projects) return map;

    data.projects.forEach((proj) => {
      if (!proj.startDate || !proj.endDate) return;

      const start = new Date(proj.startDate);
      const end = new Date(proj.endDate);
      const monthStart = new Date(currentYear, currentMonth - 1, 1);
      const monthEnd = new Date(currentYear, currentMonth, 0);

      // 只處理跟這個月有交集
      const rangeStart = start < monthStart ? monthStart : start;
      const rangeEnd = end > monthEnd ? monthEnd : end;

      for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        // 避免重複（同一天同一專案）
        if (!map[day].find((p) => p.id === proj.id)) {
          map[day].push(proj);
        }
      }
    });
    return map;
  }, [data?.projects, currentYear, currentMonth]);

  // ── 將 WorkItem mapping 到每一天 ──
  const workItemMap = useMemo(() => {
    const map: Record<number, any[]> = {};
    if (!data?.workItems) return map;

    data.workItems.forEach((wi) => {
      const date = wi.targetDate ?? wi.deadline;
      if (!date) return;
      const d = new Date(date);
      if (d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(wi);
      }
    });
    return map;
  }, [data?.workItems, currentYear, currentMonth]);

  // ── 月份切換 ──
  const goPrev = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };
  const goNext = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };
  const goToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  };

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
      
      {/* ─── 標題列 ─── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {currentYear} 年 {currentMonth} 月
          </h3>
          <button
            onClick={goToday}
            className="text-xs px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition"
          >
            今天
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <ChevronLeft className="w-4 h-4 text-zinc-500" />
          </button>
          <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* ─── 圖例 ─── */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
        {Object.entries(roleColors).map(([role, color]) => (
          <span key={role} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color.bg} border ${color.border}`} />
            {role === "ADMIN" ? "管理" : role === "PM" ? "PM" : role === "SALES" ? "業務" : "員工"}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-200 dark:bg-amber-800" />
          我的任務
        </span>
      </div>

      {/* ─── 星期標頭 ─── */}
      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-700">
        {weekdays.map((wd) => (
          <div
            key={wd}
            className={cn(
              "px-2 py-1.5 text-xs font-medium text-zinc-400 text-center",
              (wd === "日" || wd === "六") && "text-red-400"
            )}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* ─── 日期網格 ─── */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-zinc-400">載入行事曆...</div>
      ) : (
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[100px] bg-zinc-50/50 dark:bg-zinc-800/20" />;
            }

            const isToday =
              today.getDate() === day &&
              today.getMonth() + 1 === currentMonth &&
              today.getFullYear() === currentYear;

            const dayProjects = projectMap[day] ?? [];
            const dayWorkItems = workItemMap[day] ?? [];

            return (
              <div
                key={day}
                className={cn(
                  "min-h-[100px] p-1 border-b border-r border-zinc-100 dark:border-zinc-800 relative",
                  "hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition",
                  isToday && "bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-inset ring-blue-300 dark:ring-blue-700"
                )}
              >
                {/* 日期數字 */}
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-6 h-6 text-xs rounded-full mb-1",
                    isToday
                      ? "bg-blue-600 text-white font-bold"
                      : "text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {day}
                </span>

                {/* 專案橫條（最多顯示 2 條，其餘 +N） */}
                <div className="space-y-0.5">
                  {dayProjects.slice(0, 2).map((proj: any) => {
                    const color = roleColors[proj.myRole] ?? roleColors.STAFF;
                    return (
                      <div
                        key={`p-${proj.id}`}
                        className={cn(
                          "text-[10px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer",
                          "border-l-2",
                          color.bg,
                          color.text,
                          priorityColors[proj.priority] ?? "border-l-gray-400"
                        )}
                        title={`${proj.title} (${proj.myRole})`}
                      >
                        {proj.title}
                      </div>
                    );
                  })}

                  {dayProjects.length > 2 && (
                    <div className="text-[10px] text-zinc-400 pl-1">
                      +{dayProjects.length - 2} 個專案
                    </div>
                  )}

                  {/* WorkItem 小點 */}
                  {dayWorkItems.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayWorkItems.slice(0, 3).map((wi: any) => (
                        <span
                          key={`wi-${wi.id}`}
                          className={cn(
                            "inline-block w-1.5 h-1.5 rounded-full",
                            wi.isCompleted ? "bg-green-400" : "bg-amber-400"
                          )}
                          title={`${wi.title}${wi.isCompleted ? ' ✅' : ''}`}
                        />
                      ))}
                      {dayWorkItems.length > 3 && (
                        <span className="text-[9px] text-zinc-400">+{dayWorkItems.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
