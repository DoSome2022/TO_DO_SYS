"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react"; 
import Image from 'next/image'
import logo from '../../../public/logo.avif';

export function MainNavbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession(); 
  const isLoggedIn = status === "authenticated"; 

  // 動態產生客戶選單
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Aboutus", href: "/aboutus" },
    { label: "Service", href: "/service" },
  ];

  if (isLoggedIn) {
    //假設登入的若是 staff，我們甚至可以多加一個前往後台的按鈕
    if ((session?.user as any)?.role === "staff" || (session?.user as any)?.role === "admin") {
      navItems.push({ label: "前往管理後台", href: "/dashboard" });
    } else {
      navItems.push(
        { label: "發起申請", href: "/customer/apply" },
        { label: "會員中心", href: "/customer/profile" }
      );
    }
  } else {
    navItems.push({ label: "登入 / 註冊", href: "/auth/login" });
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <Image src={logo} alt="logo" width={80} height={40} />
              <span className="text-xl font-bold text-gray-600">Lovely Tour Company Limited</span>
            </Link>
          </div>

          <div className="hidden sm:flex sm:space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive ? "border-blue-500 text-gray-900" : "border-transparent text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn && (
               <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                 登出
               </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
