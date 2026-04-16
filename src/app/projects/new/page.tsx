"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
 // ← 正確引入

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc/client";
import { CreateProjectInput, createProjectSchema } from "@/lib/schemas/project";

export default function NewProjectPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: pmCandidates = [], isLoading: loadingPM } =
    trpc.project.getPMCandidates.useQuery();

  const createProject = trpc.project.createProject.useMutation({
    onSuccess: () => {
      toast.success("專案建立成功！");
      utils.project.getProjectAll.invalidate();
      router.push("/projects");
    },
    onError: (err) => {
      toast.error(err.message || "建立失敗");
    },
  });

  // 使用 CreateProjectInput 作為表單型別（允許 undefined）
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      priority: "MEDIUM",
      pmId: undefined,
    },
  });

  const onSubmit = (data: CreateProjectInput) => {
    createProject.mutate({
      title: data.title,
      description: data.description,
      startDate: data.startDate ?? undefined,
      endDate: data.endDate ?? undefined,
      priority: data.priority,        // Zod default 會確保這裡不會是 undefined
      pmId: data.pmId ?? undefined,
    });
  };

  const selectedPM = watch("pmId");

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">新增專案</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 專案名稱 */}
        <div>
          <label className="block text-sm font-medium mb-1">專案名稱 *</label>
          <Input {...register("title")} placeholder="例如：2026 夏季官網改版" />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium mb-1">專案描述</label>
          <Textarea {...register("description")} rows={4} />
        </div>

        {/* 日期選擇（保持不變） */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">開始日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left", !watch("startDate") && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("startDate") ? format(watch("startDate")!, "yyyy-MM-dd") : "選擇開始日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watch("startDate")}
                  onSelect={(date) => setValue("startDate", date ?? undefined)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">結束日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left", !watch("endDate") && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("endDate") ? format(watch("endDate")!, "yyyy-MM-dd") : "選擇結束日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watch("endDate")}
                  onSelect={(date) => setValue("endDate", date ?? undefined)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 優先級 */}
        <div>
          <label className="block text-sm font-medium mb-1">優先級</label>
          <Select 
            onValueChange={(v) => setValue("priority", v as "LOW" | "MEDIUM" | "HIGH")}
            defaultValue="MEDIUM"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HIGH">高優先</SelectItem>
              <SelectItem value="MEDIUM">中優先</SelectItem>
              <SelectItem value="LOW">低優先</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 指定 PM */}
        <div>
          <label className="block text-sm font-medium mb-1">指定專案經理 (PM)</label>
          <Select
            onValueChange={(v) => setValue("pmId", v)}
            value={selectedPM || ""}
            disabled={loadingPM}
          >
            <SelectTrigger>
              <SelectValue placeholder="請選擇 PM（可不選）" />
            </SelectTrigger>
            <SelectContent>
              {pmCandidates.map((pm: any) => (
                <SelectItem key={pm.id} value={pm.id}>
                  {pm.name} {pm.position?.name && `（${pm.position.name}）`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loadingPM && <p className="text-xs text-muted-foreground mt-1">載入 PM 清單中...</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || createProject.isPending}>
          {createProject.isPending ? "建立中..." : "建立專案"}
        </Button>
      </form>
    </div>
  );
}