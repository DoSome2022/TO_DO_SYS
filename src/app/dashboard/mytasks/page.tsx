// app/dashboard/mytasks/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react"; // 🔥 1. 引入 useSession

import { format, isSameDay } from "date-fns";
import { CheckSquare } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar"; 
import { Badge } from "@/components/ui/badge";
import { trpc } from "../../../../trpc/client";

export default function MyTasksPage() {
  // 🔥 2. 取得客戶端的 session 狀態
  const { data: session, status } = useSession();
  const CURRENT_USER_ID = session?.user?.id; // 取出真實的 ID

  const [date, setDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setDate(new Date());
  }, []);

  const { data: allWorkItems, refetch } = trpc.workitem.getworkItemAll.useQuery();

  const toggleMutation = trpc.workitem.toggleComplete.useMutation({
    onSuccess: () => refetch(),
  });

  // 🔥 3. 確保有 CURRENT_USER_ID 才過濾資料
  const myTasks = useMemo(() => {
    if (!allWorkItems || !CURRENT_USER_ID) return [];
    return allWorkItems.filter((item: any) => item.staffId === CURRENT_USER_ID); 
  }, [allWorkItems, CURRENT_USER_ID]);

  const selectedDateTasks = useMemo(() => {
    if (!date || !myTasks) return [];
    return myTasks.filter((item: any) => 
      item.targetDate && isSameDay(new Date(item.targetDate), date)
    );
  }, [date, myTasks]);

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id, isCompleted: !currentStatus });
  };

  // 🔥 4. 處理讀取中的畫面防呆
  if (status === "loading") {
    return <div className="p-8 text-slate-500">載入使用者資訊中...</div>;
  }

  if (!CURRENT_USER_ID) {
    return <div className="p-8 text-red-500">請先登入後再查看任務。</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">我的工作台</h1>
        <p className="text-slate-500 mt-1">
          早安 {session?.user?.name}，查看你今日的待辦事項。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* --- 左側：待辦清單 (佔 7 份) --- */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <CheckSquare className="w-5 h-5" /> 
              所有待辦 ({myTasks.filter((t:any) => !t.isCompleted).length})
            </h2>
          </div>

          {/* 任務列表 */}
          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <div className="text-slate-400 text-center py-10 bg-white rounded-lg border border-dashed">
                目前沒有分配給您的工作。
              </div>
            ) : (
              myTasks.map((task: any) => (
                <Card key={task.id} className={`transition-all ${task.isCompleted ? "opacity-60 bg-slate-50" : "bg-white hover:shadow-md"}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <Checkbox 
                      checked={task.isCompleted || false} 
                      onCheckedChange={() => handleToggle(task.id, task.isCompleted)}
                      className="mt-1 w-5 h-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className={`font-medium text-base ${task.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {task.title}
                        </span>
                        {task.targetDate && (
                          <span className={`text-xs px-2 py-1 rounded ${task.isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>
                            {format(new Date(task.targetDate), "MM/dd")}
                          </span>
                        )}
                      </div>
                      
                      {task.project && (
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-normal text-slate-500 bg-slate-100 hover:bg-slate-200">
                            {task.project.title}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* --- 右側：日曆 (佔 5 份) --- */}
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">工作日曆</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow-sm"
                modifiers={{
                  hasTask: (day) => myTasks.some((t:any) => t.targetDate && isSameDay(new Date(t.targetDate), day))
                }}
                modifiersStyles={{
                  hasTask: { fontWeight: 'bold', textDecoration: 'underline decoration-blue-500 decoration-2' }
                }}
              />
            </CardContent>
          </Card>
          
          {/* 選中日期的任務摘要 */}
          <Card className="bg-blue-50/50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                {date ? format(date, "yyyy/MM/dd") : "未選擇日期"} 的任務
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateTasks.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                  {selectedDateTasks.map((t: any) => (
                    <li key={t.id} className={t.isCompleted ? "line-through text-slate-400" : ""}>
                      {t.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">這一天沒有安排任務。</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
