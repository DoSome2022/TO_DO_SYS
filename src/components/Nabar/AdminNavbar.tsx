"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";


// 定義每個角色的專屬選單
const ROLE_NAV_CONFIG: Record<string, { label: string; href: string }[]> = {
  ADMIN: [
    { label: "管理版", href: "/dashboard" },
    { label: "員工管理", href: "/admin/staff" },
    { label: "職位管理", href: "/admin/positions" },
    { label: "職權管理", href: "/admin/permission" },
    { label: "客戶管理", href: "/admin/customer" },
    { label: "服務管理", href: "/admin/services" },
    { label: "公司資料", href: "/admin/companies" },
    { label: "項目資料", href: "/admin/projects" },
    { label: "對話(SALES)", href: "/admin/sales_chat" },
    { label: "💰 財務管理", href: "/admin/finance" },
    { label: "採購", href: "/sales/purchases" },
    { label: "設備借用", href: "/equipment" },
  ],
  SALES: [
    { label: "銷售看板", href: "/dashboard" },
    { label: "客戶列表", href: "/sales/customers" },
    { label: "報價管理", href: "/quotations" },
    { label: "專案檢視", href: "/sales/projects" },
    { label: "對話(ADMIN)", href: "/sales/project_chat" },
    { label: "對話(客人)", href: "/sales/conversations" },
    { label: "採購", href: "/sales/purchases" },
    { label: "客戶管理", href: "/admin/customer" },
  ],
  PM: [
    { label: "專案看板", href: "/dashboard" },
    { label: "項目管理", href: "/projects" },
    { label: "記事版", href: "/pm/todos" },
    { label: "設備借用", href: "/equipment" },
    { label: "客戶管理", href: "/admin/customer" },
  ],
  STAFF: [
    { label: "個人首頁", href: "/dashboard" },
    { label: "我的任務", href: "/dashboard/mytasks" },
    { label: "工作版本", href: "/dashboard/workversions" },
    { label: "記事版", href: "/staff/todos" },
    { label: "設備借用", href: "/equipment" },
    { label: "客戶管理", href: "/admin/customer" },
  ],
};

// 預設選單 (避免找不到角色時崩潰)
const DEFAULT_NAV = [
  { label: "管理版", href: "/dashboard" },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();



  // 1. 取得使用者的角色。如果沒登入或是沒 role，預設當作 STAFF
  // 使用 .toUpperCase() 確保能正確對應到 ROLE_NAV_CONFIG 的 Key (例如 "admin" -> "ADMIN")
  const userRole = (session?.user?.role || "STAFF").toUpperCase();

  // 2. 根據角色取得對應的選單項目陣列
  const currentNavItems = ROLE_NAV_CONFIG[userRole] || DEFAULT_NAV;

  // 避免在取得 Session 之前畫面閃爍，可以放一個骨架屏
  if (status === "loading") {
    return <div className="h-16 bg-zinc-900 border-b border-zinc-800 shadow-sm animate-pulse" />;
  }

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="text-xl font-bold text-white">Staff System</span>
              {/* 這裡可以偷偷顯示一個小標籤，讓員工知道目前的角色權限 */}
              <span className="ml-2 text-xs px-2 py-0.5 bg-zinc-800 text-amber-500 rounded border border-zinc-700">
                {userRole}
              </span>
            </Link>
          </div>

          {/* 動態渲染選單項目 */}
          <div className="hidden sm:flex sm:space-x-4">
            {currentNavItems.map((item) => {
              // 讓底下子路徑也能保持 active 狀態
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive 
                      ? "border-amber-500 text-amber-500" 
                      : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 hidden md:block">
              嗨，{session?.user?.name || "員工"}
            </span>
            <button 
              onClick={() => signOut({ callbackUrl: "/" })} 
              className="text-sm font-medium text-zinc-400 hover:text-white transition bg-zinc-800 px-3 py-1.5 rounded"
            >
              登出
            </button>
          </div>
          
        </div>
      </div>
    </nav>
  );
}
