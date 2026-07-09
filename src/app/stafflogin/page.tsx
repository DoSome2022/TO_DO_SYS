// src/app/stafflogin/page.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "../../../trpc/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  // --- 登入用的 State ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- 更改密碼用的 State ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  // --- 修改 Email State ---
  const [newEmail, setNewEmail] = useState("");

  // --- 忘記密碼 State ---
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // --- tRPC ---
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      toast.success(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await update(); // 更新 session
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const resetPassword = trpc.user.resetPasswordByEmail.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowForgotPw(false);
      setResetEmail("");
      setResetNewPassword("");
      setResetConfirmPassword("");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // 登入處理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("staff-login", {
        name: username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("發生未知的錯誤，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  // 更改密碼處理（已登入後）
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (newPassword !== confirmPassword) {
      setPwError("新密碼與確認密碼不一致");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setPwError("新密碼至少 6 個字元");
      return;
    }

    setIsChangingPw(true);
    try {
      await updateProfile.mutateAsync({
        email: newEmail || undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setPwSuccess("資料已更新！");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwError(err.message || "更新失敗");
    } finally {
      setIsChangingPw(false);
    }
  };

  // 忘記密碼處理
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetNewPassword !== resetConfirmPassword) {
      toast.error("新密碼與確認密碼不一致");
      return;
    }

    if (resetNewPassword.length < 6) {
      toast.error("密碼至少 6 個字元");
      return;
    }

    setIsResetting(true);
    try {
      await resetPassword.mutateAsync({
        email: resetEmail,
        newPassword: resetNewPassword,
      });
    } catch {
      // error 已經在 mutation 的 onError 處理
    } finally {
      setIsResetting(false);
    }
  };

  // 畫面載入中
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f2f1] font-sans">
      <div className="w-full max-w-[440px] bg-white p-11 shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
        
        <div className="flex items-center gap-1 mb-6">
          <span className="text-xl font-semibold text-gray-600 tracking-tight">
            公司內部系統
          </span>
        </div>

        {status === "authenticated" && session?.user ? (
          /* ================================
             已登入：修改個人資料（Email + 密碼）
             ================================ */
          <div className="animate-in fade-in duration-500">
            <h1 className="text-2xl font-semibold text-[#1b1b1b] mb-2">
              歡迎回來，{session.user.name}
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              目前 Email：{session.user.email || "未設定"}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              您可以在此修改您的 Email 或密碼。
            </p>

            {pwError && <div className="text-[#e81123] text-[14px] mb-4">{pwError}</div>}
            {pwSuccess && <div className="text-[#107c10] text-[14px] mb-4">{pwSuccess}</div>}

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              {/* 🆕 Email 修改 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">新的 Email</label>
                <input
                  type="email"
                  placeholder="新的 Email（留空不修改）"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full border-b border-black outline-none py-2 text-[15px] focus:border-b-2 focus:border-[#0067b8] transition-all placeholder:text-gray-500"
                />
              </div>

              <hr className="border-gray-200" />

              <div>
                <label className="block text-xs text-gray-500 mb-1">目前密碼</label>
                <input
                  type="password"
                  required
                  placeholder="輸入目前密碼以修改資料"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border-b border-black outline-none py-2 text-[15px] focus:border-b-2 focus:border-[#0067b8] transition-all placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">新密碼</label>
                <input
                  type="password"
                  placeholder="新密碼（留空不修改）"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border-b border-black outline-none py-2 text-[15px] focus:border-b-2 focus:border-[#0067b8] transition-all placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">確認新密碼</label>
                <input
                  type="password"
                  placeholder="確認新密碼"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full border-b outline-none py-2 text-[15px] focus:border-b-2 transition-all placeholder:text-gray-500 ${
                    newPassword && confirmPassword && newPassword !== confirmPassword
                      ? "border-red-500 focus:border-red-500"
                      : "border-black focus:border-[#0067b8]"
                  }`}
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-[#0067b8] hover:text-[#005da6] text-[15px] font-semibold transition-colors"
                >
                  登出
                </button>
                
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="bg-[#0067b8] hover:bg-[#005da6] text-white px-8 py-2 text-[15px] font-semibold transition-colors disabled:opacity-50"
                >
                  {updateProfile.isPending ? "儲存中..." : "儲存修改"}
                </button>
              </div>
            </form>
          </div>

        ) : showForgotPw ? (
          /* ================================
             忘記密碼畫面
             ================================ */
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-[#0067b8]" />
              <h1 className="text-2xl font-semibold text-[#1b1b1b]">忘記密碼</h1>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              輸入您的員工 Email，設定新密碼。
            </p>

            {resetPassword.error && (
              <div className="text-[#e81123] text-[14px] mb-4 bg-[#fde7e9] p-2 border border-[#f9ced1]">
                {resetPassword.error.message}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="員工 Email"
                  className="w-full border-b border-black outline-none py-2 text-[15px] focus:border-b-2 focus:border-[#0067b8] transition-all placeholder:text-gray-500"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="新密碼"
                  className="w-full border-b border-black outline-none py-2 text-[15px] focus:border-b-2 focus:border-[#0067b8] transition-all placeholder:text-gray-500"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="確認新密碼"
                  className="w-full border-b border-black outline-none py-2 text-[15px] focus:border-b-2 focus:border-[#0067b8] transition-all placeholder:text-gray-500"
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPw(false)}
                  className="text-[#0067b8] hover:text-[#005da6] text-[15px] font-semibold transition-colors"
                >
                  返回登入
                </button>
                <button
                  type="submit"
                  disabled={resetPassword.isPending}
                  className="bg-[#0067b8] hover:bg-[#005da6] text-white px-8 py-2 text-[15px] font-semibold transition-colors disabled:opacity-50"
                >
                  {resetPassword.isPending ? "處理中..." : "重設密碼"}
                </button>
              </div>
            </form>
          </div>

        ) : (
          /* ================================
             未登入：原始登入表單 + 忘記密碼連結
             ================================ */
          <div className="animate-in fade-in duration-500">
            <h1 className="text-2xl font-semibold text-[#1b1b1b] mb-4">登入</h1>
            
            {error && (
              <div className="text-[#e81123] text-[15px] mb-4 bg-[#fde7e9] p-2 border border-[#f9ced1]">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="員工帳號 (name)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border-b border-black outline-none py-2 text-[15px] focus:border-b-2 focus:border-[#0067b8] transition-all placeholder:text-gray-500"
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-b border-black outline-none py-2 text-[15px] focus:border-b-2 focus:border-[#0067b8] transition-all placeholder:text-gray-500"
                />
              </div>

              {/* 🆕 忘記密碼連結 */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPw(true);
                    setError("");
                  }}
                  className="text-[#0067b8] text-sm hover:underline"
                >
                  忘記密碼？
                </button>
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#0067b8] hover:bg-[#005da6] text-white px-8 py-2 text-[15px] font-semibold transition-colors disabled:opacity-50"
                >
                  {isLoading ? "登入中..." : "登入"}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
