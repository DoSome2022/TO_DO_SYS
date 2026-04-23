// app/staff/todos/page.tsx
import StaffTodoManager from "@/components/staff/stafftode/stafftodomanager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "我的待辦事項 | 員工專區",
  description: "管理您個人的工作項目與期限",
};

export default function StaffTodosPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-4 md:p-8">
      {/* 這裡可以加上 Breadcrumb 或其他頁面級別的 Layout */}
      
      {/* 載入我們剛剛寫好的 Client Component */}
      <StaffTodoManager />
      
    </main>
  );
}
