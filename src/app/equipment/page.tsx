// src/app/equipment/page.tsx


import { EquipmentToolbar } from "@/components/equipment/equipment-toolbar";
import { api } from "../../../trpc/server";
import { EquipmentList } from "@/components/equipment/equipment-table";



export default async function EquipmentPage() {
  // 1. 在 Server 端直接撈取資料 (SSR)
  // 如果 api.equipment.getAll 沒有權限驗證問題，可以直接在這裡呼叫
  // const equipmentList = await api.equipment.getAll({}); 

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">器材管理系統</h1>
        <EquipmentToolbar />
      </div>
      
      {/* 2. 將資料傳給 Client Component 顯示 */}
      <EquipmentList />
    </div>
  );
}
