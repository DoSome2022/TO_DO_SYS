// src/components/StaffTodoManager.tsx
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
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ListTodo,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  useMyStaffTodos,
  useToggleStaffTodo,
  useCreateStaffTodo,
  useUpdateStaffTodo,
  useDeleteStaffTodo,
} from "../../hooks/useTodos";

export default function StaffTodoManager() {
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  // 編輯狀態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");

  // Queries & Mutations
  const { data: todos, isLoading } = useMyStaffTodos();
  const toggleMutation = useToggleStaffTodo();
  const createMutation = useCreateStaffTodo();
  const updateMutation = useUpdateStaffTodo();
  const deleteMutation = useDeleteStaffTodo();

  const filteredTodos = showCompleted
    ? (todos || [])
    : (todos || []).filter((t) => !t.completed);

  const incompleteCount = (todos || []).filter((t) => !t.completed).length;

type StaffTodoItem = NonNullable<typeof todos>[number];

  // ===== 新增待辦 =====
  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({
      title: newTitle.trim(),
      targetDate: newDate || undefined,
    });
    setNewTitle("");
    setNewDate("");
  };

  // ===== 開始編輯 =====
const startEditing = (todo: StaffTodoItem) => {
  setEditingId(todo.id);
  setEditTitle(todo.Title ?? "");
  setEditDate(
    todo.targetDate
      ? format(new Date(todo.targetDate), "yyyy-MM-dd")
      : ""
  );
};


  // ===== 儲存編輯 =====
  const saveEdit = () => {
    if (!editingId || !editTitle.trim()) return;
    updateMutation.mutate({
      id: editingId,
      title: editTitle.trim(),
      targetDate: editDate || null,
    });
    setEditingId(null);
  };

  // ===== 取消編輯 =====
  const cancelEdit = () => {
    setEditingId(null);
  };

  // ===== 刪除待辦 =====
  const handleDelete = (id: string) => {
    if (confirm("確定要刪除此待辦事項？")) {
      deleteMutation.mutate({ id });
    }
  };

  // ===== 日期格式化輔助 =====
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "yyyy/MM/dd");
  };

  const formatShortDate = (date: Date | string) => {
    return format(new Date(date), "MM/dd", { locale: zhTW });
  };

  // ===== Loading =====
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

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded"
          />
          顯示已完成
        </label>
      </CardHeader>

      <CardContent>
        {/* ===== 新增待辦輸入列 ===== */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg border">
          <Input
            placeholder="輸入新待辦事項..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1"
          />
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-40"
          />
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!newTitle.trim() || createMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-1" />
            新增
          </Button>
        </div>

        {/* ===== 待辦清單 ===== */}
        {filteredTodos.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
            <p>太棒了！所有待辦都已處理完畢 🎉</p>
            <p className="text-xs mt-1">上方可新增新的待辦事項</p>
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
                    toggleMutation.mutate({
                      id: todo.id,
                      completed: !!checked,
                    });
                  }}
                  className="mt-1"
                />

                {/* 內容區域（編輯模式 vs 檢視模式） */}
                <div className="flex-1 min-w-0">
                  {editingId === todo.id ? (
                    /* ===== 編輯模式 ===== */
                    <div className="flex items-center gap-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        className="flex-1"
                        autoFocus
                      />
                      <Input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-36"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={saveEdit}
                        disabled={!editTitle.trim()}
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEdit}
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  ) : (
                    /* ===== 檢視模式 ===== */
                    <>
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

                        {/* 截止日標示 + 操作按鈕 */}
                        <div className="flex items-center gap-1 shrink-0">
                          {todo.targetDate && !todo.completed && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                new Date(todo.targetDate) < new Date()
                                  ? "border-red-300 text-red-600 bg-red-50"
                                  : "border-blue-200 text-blue-600"
                              }`}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {formatShortDate(todo.targetDate)}
                            </Badge>
                          )}

                          {/* 編輯 / 刪除按鈕（只有未完成的可以編輯） */}
                          {!todo.completed && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-7 h-7"
                                onClick={() => startEditing(todo)}
                              >
                                <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-7 h-7"
                                onClick={() => handleDelete(todo.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 來源資訊 */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        {todo.PM_TODO && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <ListTodo className="w-3 h-3" />
                            來源：{todo.PM_TODO.staff_name || "PM"} 指派
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          建立於 {formatDate(todo.createdAt)}
                        </span>
                        {todo.targetDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            截止：{formatDate(todo.targetDate)}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
