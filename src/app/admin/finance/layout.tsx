"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Receipt, DollarSign } from "lucide-react";

const financeTabs = [
  { label: "報價單", href: "/admin/finance/quotations", icon: FileText },
  { label: "收據", href: "/admin/finance/invoices", icon: Receipt },
  // { label: "尾款收據", href: "/admin/finance/payments", icon: DollarSign },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 頁面標題 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">💰 財務管理</h1>
        <p className="text-sm text-zinc-500 mt-1">管理報價單、收據以及收款狀態</p>
      </div>

      {/* 微軟風格的分頁切換（Pivot 風格） */}
      <div className="flex gap-1 mb-6 border-b border-zinc-200 dark:border-zinc-700">
        {financeTabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                isActive
                  ? "border-[#0078D4] text-[#0078D4]"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-400"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
