"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  
  // 🔥 引入 useSession 來獲取登入狀態
  const { data: session, status } = useSession();

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

  // 登入處理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("staff-login", {
        name:username,
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

  // 更改密碼處理
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (newPassword !== confirmPassword) {
      setPwError("新密碼與確認密碼不一致");
      return;
    }

    setIsChangingPw(true);
    try {
      // TODO: 在這裡呼叫你的 API 或 tRPC 來更新密碼
      // 例如：await trpc.user.changePassword.mutateAsync({ currentPassword, newPassword });
      
      // 模擬 API 延遲與成功
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPwSuccess("密碼更改成功！");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError("密碼更改失敗，請確認原密碼是否正確");
    } finally {
      setIsChangingPw(false);
    }
  };

  // 畫面載入中 (確認 Session 狀態的過渡期)
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1]">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f2f1] font-sans">
      <div className="w-full max-w-[440px] bg-white p-11 shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
        
        {/* 公司 Logo 標頭區 */}
        <div className="flex items-center gap-1 mb-6">
          <span className="text-xl font-semibold text-gray-600 tracking-tight">
            公司內部系統
          </span>
        </div>

        {/* 🔥 條件渲染：依據是否登入顯示不同畫面 */}
        {status === "authenticated" && session?.user ? (
          
          /* ================================
             已登入畫面：個人資料 & 更改密碼 
             ================================ */
          <div className="animate-in fade-in duration-500">
            <h1 className="text-2xl font-semibold text-[#1b1b1b] mb-2">
              歡迎回來，{session.user.name}
            </h1>
            <p className="text-sm text-gray-500 mb-6">您已登入系統。您可以在此修改您的密碼。</p>

            {/* 訊息提示 */}
            {pwError && <div className="text-[#e81123] text-[14px] mb-4">{pwError}</div>}
            {pwSuccess && <div className="text-[#107c10] text-[14px] mb-4">{pwSuccess}</div>}

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <input
                  type="password"
                  required
                  placeholder="原密碼"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border-b border-black outline-none py-2 text-[15px] focus:border-b-2 focus:border-[#0067b8] transition-all placeholder:text-gray-500"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  placeholder="新密碼"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border-b border-black outline-none py-2 text-[15px] focus:border-b-2 focus:border-[#0067b8] transition-all placeholder:text-gray-500"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  placeholder="確認新密碼"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border-b border-black outline-none py-2 text-[15px] focus:border-b-2 focus:border-[#0067b8] transition-all placeholder:text-gray-500"
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                {/* 登出按鈕 */}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-[#0067b8] hover:text-[#005da6] text-[15px] font-semibold transition-colors"
                >
                  登出
                </button>
                
                {/* 儲存密碼按鈕 */}
                <button
                  type="submit"
                  disabled={isChangingPw}
                  className="bg-[#0067b8] hover:bg-[#005da6] text-white px-8 py-2 text-[15px] font-semibold transition-colors disabled:opacity-50"
                >
                  {isChangingPw ? "處理中..." : "更改密碼"}
                </button>
              </div>
            </form>
          </div>

        ) : (

          /* ================================
             未登入畫面：原始登入表單 
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

              <div className="flex justify-end mt-4">
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
