// middleware.ts
import { authConfig } from "@/auth.config";
import NextAuth from "next-auth";


// ✅ 先從 NextAuth 取出 auth
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // req.auth 就是使用者的登入狀態 (session)
  const isLoggedIn = !!req.auth;
  
  // 判斷使用者是否正在訪問需要保護的路由 (例如 /dashboard 開頭的頁面)
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (isProtectedRoute && !isLoggedIn) {
    // 如果沒登入又想進去，強制導向登入頁
    const newUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

// 設定哪些路徑要觸發這個 middleware (通常排除靜態檔案和 API)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
