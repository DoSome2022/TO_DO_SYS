"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "../../../../trpc/client";

const formSchema = z.object({
  title: z.string().min(1, "標題為必填"),
  completed: z.boolean(),
  Isconfirm: z.boolean(),
  staff_name: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: (FormData & { id: string }) | null;
}

export function PmTodoFormDialog({ isOpen, onClose, initialData }: Props) {
  const utils = trpc.useUtils(); // tRPC v11 用法，用來重新整理資料
  const isEditing = !!initialData;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      completed: false,
      Isconfirm: false,
      staff_name: "",
    },
  });

  // 當傳入編輯資料時，重置表單
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        completed: initialData.completed ?? false,
        Isconfirm: initialData.Isconfirm ?? false,
        staff_name: initialData.staff_name || "",
      });
    } else {
      form.reset({ title: "", completed: false, Isconfirm: false, staff_name: "" });
    }
  }, [initialData, form, isOpen]);

  const createMutation = trpc.todo.createToDo_PM.useMutation({
    onSuccess: () => {
      toast.success("建立成功！");
      utils.todo.getToDoAll_PM.invalidate(); // 刷新列表
      onClose();
    },
  });

  const updateMutation = trpc.todo.updateToDo_PM.useMutation({
    onSuccess: () => {
      toast.success("更新成功！");
      utils.todo.getToDoAll_PM.invalidate();
      onClose();
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing && initialData) {
      updateMutation.mutate({ id: initialData.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "編輯 PM 待辦事項" : "建立 PM 待辦事項"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium">任務標題</label>
            <Input {...form.register("title")} placeholder="輸入任務標題..." />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium">負責員工 (選填)</label>
            <Input {...form.register("staff_name")} placeholder="例如：John Doe" />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="completed" 
              checked={form.watch("completed")}
              onCheckedChange={(checked) => form.setValue("completed", checked as boolean)}
            />
            <label htmlFor="completed" className="text-sm">標記為完成</label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="Isconfirm" 
              checked={form.watch("Isconfirm")}
              onCheckedChange={(checked) => form.setValue("Isconfirm", checked as boolean)}
            />
            <label htmlFor="Isconfirm" className="text-sm">PM 已確認</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>取消</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "儲存中..." : "儲存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
