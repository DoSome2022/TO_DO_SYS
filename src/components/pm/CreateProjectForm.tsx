"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { trpc } from "../../../trpc/client";

interface CreateProjectFormProps {
  onSuccess: () => void;
}

export default function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
const [formData, setFormData] = useState<{
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  startDate: string;
  endDate: string;
}>({
  title: "",
  description: "",
  priority: "MEDIUM",   // ← 這裡還是給實際值
  startDate: "",
  endDate: "",
});


  const createProject = trpc.project.createProject.useMutation({
    onSuccess: () => {
      onSuccess(); // 關閉 Modal 並刷新列表
      // 重置表單
      setFormData({
        title: "",
        description: "",
        priority: "LOW",
        startDate: "",
        endDate: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 準備傳送給後端的資料
    createProject.mutate({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      // 如果有填日期，轉成 Date 物件；沒填則為 undefined
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="title">專案名稱 <span className="text-red-500">*</span></Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="例如：2024 夏季行銷活動"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">開始日期</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">截止日期</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">優先級</Label>
        <Select 
            value={formData.priority} 
            onValueChange={(val: "LOW" | "MEDIUM" | "HIGH") => 
            setFormData({ ...formData, priority: val })
          }

        >
          <SelectTrigger>
            <SelectValue placeholder="選擇優先級" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">🟢 低 (Low)</SelectItem>
            <SelectItem value="MEDIUM">🟡 中 (Medium)</SelectItem>
            <SelectItem value="HIGH">🔴 高 (High)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="簡述專案目標與內容..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={createProject.isPending}>
        {createProject.isPending ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 建立中...
            </>
        ) : (
            "建立專案"
        )}
      </Button>
    </form>
  );
}
