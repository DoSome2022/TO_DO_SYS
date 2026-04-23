"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "../../../../trpc/client";


const formSchema = z.object({
  title: z.string().min(1, "標題為必填"),
  targetDate: z.string().optional(), // 簡單用 string 處理 input type="date"
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: (FormData & { id: string }) | null;
}

export function StaffTodoFormDialog({ isOpen, onClose, initialData }: Props) {
  const utils = trpc.useUtils();
  const isEditing = !!initialData;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", targetDate: "" },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        targetDate: initialData.targetDate || "",
      });
    } else {
      form.reset({ title: "", targetDate: "" });
    }
  }, [initialData, form, isOpen]);

  const createMutation = trpc.todo.createToDo_Staff.useMutation({
    onSuccess: () => {
      toast.success("新增成功！");
      utils.todo.getMyTasks.invalidate();
      onClose();
    },
  });

  const updateMutation = trpc.todo.updateToDo_Staff.useMutation({
    onSuccess: () => {
      toast.success("更新成功！");
      utils.todo.getMyTasks.invalidate();
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
          <DialogTitle>{isEditing ? "編輯任務" : "新增個人任務"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">任務內容</label>
            <Input {...form.register("title")} placeholder="例如：完成 API 開發" />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium">截止日期 (選填)</label>
            <Input type="date" {...form.register("targetDate")} />
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
