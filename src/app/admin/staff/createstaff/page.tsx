"use client";

import { useState } from "react";
import StaffForm from "@/components/staff/createstaff";


// 這裡定義跟 Form 一樣的型別，方便使用
type StaffData = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function StaffPage() {
  // 用來記錄「現在正在編輯誰」，如果是 null 代表是新增模式
  const [editingStaff, setEditingStaff] = useState<StaffData | null>(null);


  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">建立員工管理</h1>

      {/* === 呼叫表單元件 === */}
      <StaffForm 
        initialData={editingStaff} 
        onSuccess={() => setEditingStaff(null)} // 成功後，重置回新增模式
        onCancel={() => setEditingStaff(null)}  // 取消後，重置回新增模式
      />


    </div>
  );
}
