// app/profile/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { trpc } from "../../../trpc/client";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [newEmail, setNewEmail] = useState(session?.user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      toast.success(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // 更新 session
      await update();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error("請輸入有效的 Email 格式");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("新密碼與確認密碼不一致");
      return;
    }

    if (!newEmail && !newPassword) {
      toast.error("請填寫要修改的欄位");
      return;
    }

    if (newPassword && !currentPassword) {
      toast.error("修改密碼必須提供目前密碼");
      return;
    }

    await updateProfile.mutateAsync({
      email: newEmail || undefined,
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    });
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-2xl font-bold mb-2">個人資料</h1>
        <p className="text-gray-500 mb-6">
          修改您的 Email 或密碼
        </p>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">帳號：</span>
            <span className="font-medium">{session.user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">角色：</span>
            <span className="font-medium">{(session.user as any)?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">目前 Email：</span>
            <span className="font-medium">{session.user.email || "未設定"}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">新的 Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="新的 Email（留空不修改）"
            />
          </div>

          <hr />

          {/* 目前密碼 */}
          <div>
            <label className="block text-sm font-medium mb-1">目前密碼</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="修改密碼時必填"
            />
          </div>

          {/* 新密碼 */}
          <div>
            <label className="block text-sm font-medium mb-1">新密碼</label>
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="新密碼（留空不修改）"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 確認新密碼 */}
          <div>
            <label className="block text-sm font-medium mb-1">確認新密碼</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full border rounded-lg p-2.5 focus:ring-2 outline-none ${
                newPassword && confirmPassword && newPassword !== confirmPassword
                  ? "border-red-500 focus:ring-red-500"
                  : "focus:ring-blue-500 focus:border-blue-500"
              }`}
              placeholder="再次輸入新密碼"
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1">密碼不一致</p>
            )}
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {updateProfile.isPending ? "儲存中..." : "儲存修改"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
