"use client";


import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { trpc } from "../../../../trpc/client";

// 這裡的 Type 可以從 router infer 出來，為了方便直接定義
type PmTodo = {
  id: string;
  Title: string | null;
  completed: boolean | null;
  Isconfirm: boolean | null;
  staff_name: string | null;
};

interface Props {
  todo: PmTodo;
  onEdit: (todo: PmTodo) => void;
}

export function PmTodoItem({ todo, onEdit }: Props) {
  const utils = trpc.useUtils();
  
  const deleteMutation = trpc.todo.deleteToDo_PM.useMutation({
    onSuccess: () => {
      toast.success("已刪除任務");
      utils.todo.getToDoAll_PM.invalidate(); // 刷新列表
    },
    onError: () => toast.error("刪除失敗"),
  });

  const handleDelete = () => {
    if (confirm("確定要刪除這個任務嗎？")) {
      deleteMutation.mutate({ id: todo.id });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-white dark:bg-zinc-950 mb-2">
      <div className="flex flex-col">
        <h3 className={`font-semibold text-lg ${todo.completed ? 'line-through text-gray-400' : ''}`}>
          {todo.Title}
        </h3>
        <span className="text-sm text-gray-500">
          負責人: {todo.staff_name || "未指定"} | 
          狀態: {todo.completed ? "🟢 已完成" : "⏳ 進行中"} | 
          確認: {todo.Isconfirm ? "✅ PM已確認" : "❌ 未確認"}
        </span>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={() => onEdit(todo)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button 
          variant="destructive" 
          size="icon" 
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
