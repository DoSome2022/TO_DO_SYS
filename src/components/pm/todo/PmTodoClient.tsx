"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { PmTodoItem } from "./PmTodoItem";
import { trpc } from "../../../../trpc/client";
import { PmTodoFormDialog } from "./PmRodoFormDialog";

export function PmTodoClient() {
  // 取得 PM Todo List
  const { data: todos, isLoading, isError } = trpc.todo.getToDoAll_PM.useQuery();
  
  // 狀態管理：表單彈窗開關與當前編輯的資料
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<any>(null);

  const handleCreateNew = () => {
    setEditingTodo(null); // 清空編輯資料代表是「新建」
    setIsDialogOpen(true);
  };

  const handleEdit = (todo: any) => {
    // 轉換資料格式給 Form (因為 Prisma 欄位是大寫 Title，Form 是小寫 title)
    setEditingTodo({
      id: todo.id,
      title: todo.Title || "",
      completed: todo.completed || false,
      Isconfirm: todo.Isconfirm || false,
      staff_name: todo.staff_name || "",
    });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div>載入任務中...</div>;
  if (isError) return <div>載入失敗，請確認權限或網路狀態。</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">PM 專案待辦清單</h1>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" /> 新建任務
        </Button>
      </div>

      <div className="space-y-3">
        {todos?.length === 0 ? (
          <p className="text-gray-500 text-center py-10">目前沒有任何任務</p>
        ) : (
          todos?.map((todo) => (
            <PmTodoItem 
              key={todo.id} 
              todo={todo} 
              onEdit={handleEdit} 
            />
          ))
        )}
      </div>

      <PmTodoFormDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        initialData={editingTodo}
      />
    </div>
  );
}
