// src/components/TodoListViewer.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ListTodo,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useMyStaffTodos, useToggleStaffTodo } from "../../hooks/useTodos";

type TodoListViewerProps = {
  /** 顯示模式：個人 or PM 總覽 */
  mode?: "staff" | "pm";
};

export default function TodoListViewer({ mode = "staff" }: TodoListViewerProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  // Staff 模式：抓自己的 Staff_TODO
  const { data: staffTodos, isLoading: staffLoading } = useMyStaffTodos();
  const toggleMutation = useToggleStaffTodo();

  // PM 模式：抓 PM_TODO（保留未來擴充）
  // const { data: pmTodos, isLoading: pmLoading } = useMyPMTodos();

  const isLoading = staffLoading;
  const todos = staffTodos || [];

  const filteredTodos = showCompleted
    ? todos
    : todos.filter((t) => !t.completed);

  const incompleteCount = todos.filter((t) => !t.completed).length;

  // ===== 渲染 =====
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">我的待辦事項</CardTitle>
          {incompleteCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {incompleteCount} 項未完成
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded"
            />
            顯示已完成
          </label>
        </div>
      </CardHeader>

      <CardContent>
        {filteredTodos.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
            <p>太棒了！所有待辦都已處理完畢 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  todo.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {/* 勾選框 */}
                <Checkbox
                  checked={todo.completed ?? false}
                    onCheckedChange={(checked) => {
                    toggleMutation.mutate({ id: todo.id, completed: !!checked });
                    }}

                  className="mt-1"
                />

                {/* 待辦內容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`font-medium text-sm ${
                        todo.completed
                          ? "line-through text-muted-foreground"
                          : "text-gray-900"
                      }`}
                    >
                      {todo.Title}
                    </p>

                    {/* 截止日標示 */}
                    {todo.targetDate && !todo.completed && (
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${
                          new Date(todo.targetDate) < new Date()
                            ? "border-red-300 text-red-600 bg-red-50"
                            : "border-blue-200 text-blue-600"
                        }`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(todo.targetDate), "MM/dd", {
                          locale: zhTW,
                        })}
                      </Badge>
                    )}
                  </div>

                  {/* 來源資訊 */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {todo.PM_TODO && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        來源：{todo.PM_TODO.staff_name || "PM"} 指派
                    </span>
                    )}

                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      建立於 {format(new Date(todo.createdAt), "yyyy/MM/dd")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
