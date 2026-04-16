"use client";

import { ServiceForm } from "@/components/Service/ServiceForm";
import { useServices } from "../../../../hooks/use-services";
import { ServiceTable } from "@/components/Service/ServiceTable";



export default function AdminServicesPage() {
  // 1. 引入邏輯
  const { 
    services, 
    isLoading, 
    createService, 
    isCreating, 
    toggleActive, 
    deleteService 
  } = useServices();

  // 2. 組合 View
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">服務項目管理</h1>
        {/* 表單區塊 */}
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-zinc-900">
          <ServiceForm 
            onSubmit={async (data) => {
              console.log("Page 接收到的資料:", data); // 確保這裡也有資料
              await createService(data);
            }} 
            isLoading={isCreating} 
          />
        </div>
      </div>

      {/* 列表區塊 */}
      <div className="border rounded-lg p-4">
        <ServiceTable 
          services={services ?? []} 
          isLoading={isLoading} 
          onToggleActive={(id, currentStatus) => toggleActive({ id, isActive: !currentStatus })}
          onDelete={(id) => deleteService({ id })}
        />
      </div>
    </div>
  );
}
