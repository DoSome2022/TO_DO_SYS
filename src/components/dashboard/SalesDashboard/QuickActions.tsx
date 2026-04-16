"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  MessageCircle,
  FileText,
  TrendingUp,
  Calendar,
  Settings,
} from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  variant?: "default" | "outline" | "ghost";
  color?: string;
}

export default function QuickActions() {
  const actions: QuickAction[] = [
    {
      title: "客戶管理",
      description: "管理客戶資訊、追蹤對話記錄",
      icon: <Users className="w-5 h-5" />,
      href: "/sales/customers",
      variant: "default",
      color: "bg-blue-50 text-blue-600",
    },
    // {
    //   title: "客戶對話",
    //   description: "查看最近的客戶對話",
    //   icon: <MessageCircle className="w-5 h-5" />,
    //   href: "/sales/customers",
    //   variant: "outline",
    //   color: "text-emerald-600",
    // },
    {
      title: "新增報價單",
      description: "為客戶建立新的報價單",
      icon: <FileText className="w-5 h-5" />,
      href: "/quotations/new",
      variant: "outline",
      color: "text-amber-600",
    },
    // {
    //   title: "業績報表",
    //   description: "查看銷售業績統計",
    //   icon: <TrendingUp className="w-5 h-5" />,
    //   href: "/sales/reports",
    //   variant: "ghost",
    //   color: "text-purple-600",
    // },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <Link key={index} href={action.href} className="block group">
          <Card className="p-4 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${action.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{action.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {action.description}
                </p>
              </div>
              <svg 
                className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}