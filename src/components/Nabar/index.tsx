"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react"; // 引入 useSession
import { AdminNavbar } from "./AdminNavbar";
import { MainNavbar } from "./MainNavbar";

export default function NavbarWrapper() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname.startsWith("/auth")) {
    return null;
  }

  // 還在載入 session 時，避免畫面閃爍
  if (status === "loading") {
    return <div className="h-16 bg-white border-b border-gray-200 shadow-sm animate-pulse" />;
  }

  // 取得角色 (假設客人的 role 是 "customer" 或 "CUSTOMER")
  const role = session?.user?.role?.toUpperCase();

  // 如果是未登入，或是角色是 CUSTOMER，就顯示 MainNavbar
  if (!session || role === "CUSTOMER") {
    // 雖然客人是用 MainNavbar，但如果他硬要闖入 /admin 網址，你可能需要另外的 middleware 擋住他
    return <MainNavbar />;
  }

  // 剩下的情況：已登入，且角色不是客人的員工 (ADMIN, SALES, PM, STAFF 等)
  // 不管他們現在在哪個網址，統統顯示 AdminNavbar
  return <AdminNavbar />;
}
