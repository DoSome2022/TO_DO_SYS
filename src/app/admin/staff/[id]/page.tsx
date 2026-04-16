"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"; // 🔥 新增引入 Switch 元件
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "../../../../../trpc/client";


// 1. 定義 Zod 驗證規則 (加入 permissions 陣列與 isActive 布林值)
const formSchema = z.object({
  name: z.string().min(1, "姓名不可為空"),
  role: z.enum(["PM", "STAFF", "SALES"], { message: "請選擇角色" }), 
  positionId: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(), 
  isActive: z.boolean().optional(), // 🔥 新增 isActive 驗證
});

// 定義系統中可用的 PM 權限列表 (請依照您的實際需求修改)
const AVAILABLE_PERMISSIONS = [
  { id: "manage_users", label: "管理人員" },
  { id: "manage_projects", label: "管理專案" },
  { id: "view_reports", label: "檢視報表" },
];

export default function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  // --- 表單狀態管理 ---
  const [formData, setFormData] = useState({
    name: "",
    role: "STAFF",
    positionId: "none", 
    permissions: [] as string[], 
    isActive: true, // 🔥 新增儲存登入權限的狀態，預設為 true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- tRPC 查詢與寫入 ---
  const { data: user, isLoading: isUserLoading } = trpc.user.getUserById.useQuery(
    { id },
    { enabled: !!id }
  );

  const { data: positions, isLoading: isPositionsLoading } =
    trpc.user.getPositionsForDropdown.useQuery();

  const updateMutation = trpc.user.updateUser.useMutation({
    onSuccess: () => {
      toast.success("員工資料更新成功！");
      router.push("/admin/staff");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`更新失敗: ${error.message}`);
    },
  });

  // --- 當取得使用者資料時，回填表單 ---
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        role: user.role,
        positionId: user.position || "none",
        // 假設後端 user 有 permissions 欄位，如沒有請根據您的 Prisma schema 調整提取方式
        permissions: (user as any).permissions?.map((p: any) => p.name || p) || [], 
        isActive: user.isActive ?? true, // 🔥 將資料庫的登入權限狀態帶入表單
      });
    }
  }, [user]);

  // --- 處理 Checkbox 變更 (針對權限) ---
  const handlePermissionChange = (permId: string, checked: boolean) => {
    setFormData((prev) => {
      if (checked) {
        return { ...prev, permissions: [...prev.permissions, permId] };
      } else {
        return { ...prev, permissions: prev.permissions.filter((p) => p !== permId) };
      }
    });
  };

  // --- 處理表單送出 ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); 

    // 準備要驗證與送出的資料 (如果是 STAFF 就清空 PM 權限)
    const payload = {
      name: formData.name,
      role: formData.role,
      positionId: formData.positionId === "none" ? null : formData.positionId,
      permissions: formData.role === "PM" ? formData.permissions : [],
      isActive: formData.isActive, // 🔥 將登入權限放入 payload 中
    };

    const result = formSchema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // 執行 tRPC Mutation
    updateMutation.mutate({
      id,
      ...result.data,
    });
  };

  if (isUserLoading || isPositionsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <div className="p-8 text-destructive">找不到該員工資料。</div>;
  }

  return (
    <div className="max-w-2xl p-6 mx-auto mt-10 border rounded-lg shadow-sm bg-card text-card-foreground">
      <h1 className="mb-6 text-2xl font-bold">編輯員工資料</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 姓名欄位 */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium leading-none">員工姓名</label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="輸入員工姓名..."
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        {/* 角色下拉選單 */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">系統角色</label>
          <Select
            value={formData.role}
            onValueChange={(val) => setFormData({ ...formData, role: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇系統角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STAFF">一般員工 (STAFF)</SelectItem>
              <SelectItem value="PM">專案經理 (PM)</SelectItem>
              <SelectItem value="SALES">業務人員 (SALES)</SelectItem> 
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
        </div>

        {/* 當角色為 PM 時才顯示的權限設定區塊 */}
        {formData.role === "PM" && (
          <div className="space-y-3 p-4 border rounded-md bg-muted/50">
            <label className="text-sm font-medium leading-none">PM 專屬權限設定</label>
            <div className="flex flex-col gap-2 mt-2">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.permissions.includes(perm.id)}
                    onChange={(e) => handlePermissionChange(perm.id, e.target.checked)}
                  />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 職位下拉選單 */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">職位 (STAFF 適用)</label>
          <Select
            value={formData.positionId}
            onValueChange={(val) => setFormData({ ...formData, positionId: val })}
            disabled={formData.role === "PM"}
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇員工職位" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">無職位</SelectItem>
              {positions?.map((position: any) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.name || position.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 🔥 新增：登入權限設定區塊 */}
        <div className="flex flex-row items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">登入權限</label>
            <p className="text-[0.85rem] text-slate-500">
              設定此員工是否可以登入系統
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={formData.isActive ? "text-green-600 text-sm font-medium" : "text-red-500 text-sm font-medium"}>
              {formData.isActive ? "允許登入" : "已停用"}
            </span>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={updateMutation.isPending}>
            取消
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            儲存變更
          </Button>
        </div>
      </form>
    </div>
  );
}
