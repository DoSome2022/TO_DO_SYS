//src/components/WorkItemsViewer.tsx

"use client";

import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Wrench,
  CalendarPlus,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

import { trpc } from "../../trpc/client";
import { useHasPermission, useUserProfile } from "../../hooks/useUserProfile";
import { EquipmentCheckoutDialog } from "./equipment/equipmentCheckoutDialog";

interface Staff {
  id: string;
  name: string | null;
}

interface WorkItemsViewerProps {
  initialStaffId?: string;
  isPmMode?: boolean;
  staffList?: Staff[];
}

export default function WorkItemsViewer({
  initialStaffId,
  isPmMode = false,
  staffList = [],
}: WorkItemsViewerProps) {
  const { data: profile } = useUserProfile();
  const hasPermission = useHasPermission();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    initialStaffId || "",
  );
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedEquipmentLogs, setExpandedEquipmentLogs] = useState<string[]>(
    [],
  );

  const [eqDialogOpen, setEqDialogOpen] = useState(false);
  const [activeTaskForEq, setActiveTaskForEq] = useState<{
    id: string;
    title: string;
    projectId: string | null;
  } | null>(null);

  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [activeReturnLog, setActiveReturnLog] = useState<any>(null);
  const [returnCondition, setReturnCondition] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnUsageEndTime, setReturnUsageEndTime] = useState("");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const canViewAll = hasPermission("WORKITEM_VIEW_ALL");
  const canViewOwn = hasPermission("WORKITEM_VIEW_OWN");

  const effectiveStaffId = useMemo(() => {
    if (isPmMode && canViewAll) {
      return selectedStaffId || initialStaffId || "";
    }
    return profile?.id || "";
  }, [isPmMode, canViewAll, selectedStaffId, initialStaffId, profile?.id]);

  const { data: workItems = [], isLoading, refetch } =
    trpc.workitem.getWorkItemsByStaff.useQuery(
      {
        staffId: effectiveStaffId,
        startDate: viewMode === "calendar" ? monthStart : undefined,
        endDate: viewMode === "calendar" ? monthEnd : undefined,
      },
      { enabled: !!effectiveStaffId },
    );

  const toggleComplete = trpc.workitem.toggleComplete.useMutation({
    onSuccess: () => refetch(),
  });

  const updateTargetDate = trpc.workitem.updateTargetDate.useMutation({
    onSuccess: () => refetch(),
  });

  const checkinMutation = trpc.equipment.checkin.useMutation({
    onSuccess: () => {
      refetch();
      setReturnDialogOpen(false);
      setActiveReturnLog(null);
      setReturnCondition("");
      setReturnNotes("");
      setReturnUsageEndTime("");
    },
  });

  const handleOpenEqDialog = (item: any) => {
    setActiveTaskForEq({
      id: item.id,
      title: item.title,
      projectId: item.projectId || item.project?.id || null,
    });
    setEqDialogOpen(true);
  };

  const handleEquipmentCheckoutSuccess = () => {
    refetch();
    setEqDialogOpen(false);
  };

  const handleOpenReturnDialog = (log: any) => {
    setActiveReturnLog(log);
    setReturnCondition("");
    setReturnNotes("");
    setReturnUsageEndTime("");
    setReturnDialogOpen(true);
  };

  const handleSubmitReturn = () => {
    if (!activeReturnLog) return;

    checkinMutation.mutate({
      equipmentId: activeReturnLog.equipmentId,
      notes: returnNotes || undefined,
      condition: returnCondition || undefined,
      usageEndTime: returnUsageEndTime ? new Date(returnUsageEndTime) : undefined,
    });
  };

  const toggleEquipmentLogExpand = (logId: string) => {
    setExpandedEquipmentLogs((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId],
    );
  };

  if (isPmMode && !canViewAll && !canViewOwn) {
    return (
      <Card className="w-full">
        <CardContent className="py-12 text-center text-muted-foreground">
          您沒有權限查看工作項目
        </CardContent>
      </Card>
    );
  }

console.log("data:", workItems, "-- End --");

  const renderListView = () => {
    if (!workItems.length) {
      return (
        <div className="text-gray-500 py-12 text-center">目前沒有工作項目</div>
      );
    }

    return (
      <div className="space-y-4">
        {workItems.map((item: any) => {
          const hasEquipmentLogs = item.equipmentLogs?.length > 0;

          return (
            <div
              key={item.id}
              className="border rounded-lg bg-card hover:bg-accent/5 transition"
            >
              <div className="flex items-center p-4">
                <Checkbox
                  checked={item.isCompleted ?? false}
                  onCheckedChange={(checked) =>
                    toggleComplete.mutate({
                      id: item.id,
                      isCompleted: !!checked,
                    })
                  }
                  className="mr-4"
                />

                <div className="flex-1 min-w-0">
                  <div
                    className={`font-medium ${
                      item.isCompleted
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {item.title}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-1 text-xs">
                    {item.project && (
                      <div className="text-muted-foreground flex items-center">
                        📂 {item.project.title}
                      </div>
                    )}

                    {item.deadline && (
                      <div className="text-red-500 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        死線: {format(new Date(item.deadline), "yyyy/MM/dd")}
                      </div>
                    )}

                    {item.targetDate && (
                      <div className="text-blue-600 flex items-center">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        預計執行: {format(new Date(item.targetDate), "yyyy/MM/dd")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!item.isCompleted && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarPlus className="w-4 h-4 mr-2" />
                          {item.targetDate ? "改期" : "排程"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={
                            item.targetDate ? new Date(item.targetDate) : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              updateTargetDate.mutate({
                                id: item.id,
                                targetDate: date.toISOString(),
                              });
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  {!item.isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEqDialog(item)}
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      借設備
                    </Button>
                  )}
                </div>
              </div>

              {hasEquipmentLogs && (
                <div className="border-t px-4 py-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-sm font-medium">
                      <Package className="w-4 h-4 mr-2" />
                      已借用裝備 ({item.equipmentLogs.length} 項)
                    </div>
                  </div>

                  <div className="space-y-2">
                    {item.equipmentLogs.map((log: any) => {
                      const isExpanded = expandedEquipmentLogs.includes(log.id);
                      const isReturned = !!log.returnedAt;
                      const hasUsageSchedules = log.usageSchedules?.length > 0;

                      return (
                        <Collapsible
                          key={log.id}
                          open={isExpanded}
                          onOpenChange={() => toggleEquipmentLogExpand(log.id)}
                        >
                          <div className="bg-background rounded-md border p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    isReturned ? "bg-green-500" : "bg-amber-500"
                                  }`}
                                />
                                <span className="font-medium">
                                  {log.equipment?.name || "未知設備"}
                                  {log.equipment?.modelNumber
                                    ? ` (${log.equipment.modelNumber})`
                                    : ""}
                                </span>

                                <Badge variant="outline" className="ml-2">
                                  {log.equipment?.billingType === "HOURLY"
                                    ? "時租"
                                    : log.equipment?.billingType === "DAILY"
                                      ? "日租"
                                      : "免費"}
                                </Badge>

                                {log.equipment?.price > 0 && (
                                  <Badge variant="secondary" className="ml-1">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    ${log.equipment.price}/
                                    {log.equipment?.billingType === "HOURLY"
                                      ? "hr"
                                      : "day"}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(log.borrowedAt), "MM/dd HH:mm")}
                                  {isReturned &&
                                    ` → ${format(new Date(log.returnedAt), "MM/dd HH:mm")}`}
                                </span>

                                <div className="flex items-center gap-2">
                                  {!isReturned ? (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenReturnDialog(log);
                                      }}
                                    >
                                      歸還設備
                                    </Button>
                                  ) : (
                                    <Badge variant="secondary">已歸還</Badge>
                                  )}

                                  {hasUsageSchedules && (
                                    <CollapsibleTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2"
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="w-3 h-3" />
                                        ) : (
                                          <ChevronDown className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </CollapsibleTrigger>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                {isReturned ? (
                                  <span className="text-green-600">已歸還</span>
                                ) : (
                                  <span className="text-amber-600">借用中</span>
                                )}
                              </div>

                              {isReturned && log.totalCost != null && (
                                <div className="flex items-center">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  成本: ${Number(log.totalCost).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>

                          {hasUsageSchedules && (
                            <CollapsibleContent className="px-3 pb-3">
                              <div className="space-y-2 pt-2">
                                {log.usageSchedules.map((schedule: any) => {
                                  const start = schedule.startTime ? new Date(schedule.startTime) : null;
                                  const end = schedule.endTime ? new Date(schedule.endTime) : null;
                                  
                                  const isValidStart = start && !isNaN(start.getTime());
                                  const isValidEnd = end && !isNaN(end.getTime());
                                  return (
                                    <div
                                      key={schedule.id}
                                      className="text-xs border rounded p-2 bg-muted/20"
                                    >
                                      {isValidStart ? format(start, "yyyy/MM/dd HH:mm") : "未定"} -{" "}
                                      {isValidEnd ? format(end, "yyyy/MM/dd HH:mm") : "未定"}
                                    </div>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          )}
                        </Collapsible>
                      );
                    })}
                  </div>
                </div>
              )}


                            {/* 🆕 顯示暫停原因 */}
              {item.suspendReason && (
                <div className="flex items-center gap-2 p-2 mx-4 mb-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-xs text-orange-700 dark:text-orange-300">
                    {item.suspendReason}
                  </span>
                </div>
              )}
              {/* 🆕 顯示來源標記 */}
              {item.source === "QUOTATION" && !item.suspendReason && (
                <div className="flex items-center gap-1 px-4 pb-3">
                  <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50">
                    來自報價單
                  </Badge>
                </div>
              )}
            </div>


          );
        })}
      </div>
    );
  };

  const renderCalendarView = () => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
              )
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="font-semibold">
            {format(currentDate, "yyyy年 MMMM", { locale: zhTW })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
              )
            }
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div key={day} className="text-center text-sm font-medium py-2">
              {day}
            </div>
          ))}

          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`min-h-[80px] border p-2 rounded-md ${
                isSameDay(day, new Date()) ? "bg-blue-50 border-blue-200" : ""
              }`}
            >
              <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="w-full relative">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">
            {isPmMode ? "團隊工作概覽" : "我的工作清單"}
          </CardTitle>

          <div className="flex items-center gap-3">
            {isPmMode && canViewAll && (
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="選擇員工" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name || "未命名員工"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="w-4 h-4 mr-1" /> 清單
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                <CalendarIcon className="w-4 h-4 mr-1" /> 日曆
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === "list" ? (
            renderListView()
          ) : (
            renderCalendarView()
          )}
        </CardContent>
      </Card>

      {activeTaskForEq && profile?.id && (
        <EquipmentCheckoutDialog
          isOpen={eqDialogOpen}
          onClose={() => setEqDialogOpen(false)}
          onSuccess={handleEquipmentCheckoutSuccess}
          projectId={activeTaskForEq.projectId}
          workItemTitle={activeTaskForEq.title}
          userId={profile.id}
          taskId={activeTaskForEq.id}
        />
      )}

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>歸還設備</DialogTitle>
            <DialogDescription>
              確認將此設備標記為已歸還，系統會自動計算總費用。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
              <div>
                <span className="font-medium">設備：</span>
                {activeReturnLog?.equipment?.name || "-"}
              </div>
              <div>
                <span className="font-medium">借用時間：</span>
                {activeReturnLog?.borrowedAt
                  ? format(
                      new Date(activeReturnLog.borrowedAt),
                      "yyyy/MM/dd HH:mm",
                    )
                  : "-"}
              </div>
              <div>
                <span className="font-medium">計費方式：</span>
                {activeReturnLog?.equipment?.billingType || "-"}
              </div>
              <div>
                <span className="font-medium">單價：</span>
                {activeReturnLog?.equipment?.price ?? 0}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="return-condition">歸還狀況</Label>
              <Input
                id="return-condition"
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                placeholder="例如：正常、刮傷、需維修..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="return-notes">歸還備註</Label>
              <Textarea
                id="return-notes"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="可填寫歸還補充說明..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="return-time">實際結束時間（選填）</Label>
              <Input
                id="return-time"
                type="datetime-local"
                value={returnUsageEndTime}
                onChange={(e) => setReturnUsageEndTime(e.target.value)}
              />
            </div>

            {checkinMutation.error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {checkinMutation.error.message}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReturnDialogOpen(false)}
              disabled={checkinMutation.isPending}
            >
              取消
            </Button>
            <Button onClick={handleSubmitReturn} disabled={checkinMutation.isPending}>
              {checkinMutation.isPending ? "歸還中..." : "確認歸還"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
