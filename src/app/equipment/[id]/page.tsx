// app/equipment/[id]/page.tsx
import { db } from "@/app/lib/prisma";
import { EquipmentHistory } from "@/components/equipment/equipment-history";
import { BorrowEquipmentModal } from "@/components/equipment/BorrowEquipmentModal";

export default async function EquipmentDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const equipmentData = await db.equipment.findUnique({
    where: { id },
    include: {
      loanItems: {
        include: { loan: true },
        orderBy: { loan: { startDate: 'desc' } }
      },
      maintenanceRecords: { orderBy: { startDate: 'desc' } },
      logs: {
        include: { borrowedBy: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!equipmentData) return <div>找不到設備</div>;

  // ... (保留你原本的 equipmentForHistory 轉換邏輯) ...

  // 翻譯計費方式，用於 UI 顯示
  const billingText = equipmentData.billingType === "HOURLY" ? "按小時計費" : 
                      equipmentData.billingType === "DAILY" ? "按天計費" : "免費借用";

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">{equipmentData.name} 的歷史紀錄</h1>
          <p className="text-gray-500 mt-1">
            當前狀態：<span className="font-semibold text-black">{equipmentData.status}</span>
          </p>
          {/* 👇 新增顯示計費資訊 */}
          {equipmentData.billingType !== "NONE" && (
            <p className="text-sm text-blue-600 mt-1">
              計費規則：{billingText} (${equipmentData.price})
            </p>
          )}
        </div>
        
        {/* 👇 將計費資訊傳給 Client Component */}
        <BorrowEquipmentModal 
          equipmentId={equipmentData.id} 
          equipmentName={equipmentData.name}
          currentStatus={equipmentData.status}
          billingType={equipmentData.billingType}
          price={equipmentData.price}
        />
      </div>
      
      <div className="mt-8">
        {/* <EquipmentHistory equipment={equipmentForHistory} /> */}
      </div>
    </div>
  );
}
