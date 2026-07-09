// // app/equipment/[id]/page.tsx
// import { db } from "@/app/lib/prisma";
// import { EquipmentHistory } from "@/components/equipment/equipment-history";
// import { BorrowEquipmentModal } from "@/components/equipment/BorrowEquipmentModal";

// export default async function EquipmentDetailPage({ 
//   params 
// }: { 
//   params: Promise<{ id: string }> 
// }) {
//   const { id } = await params;

//   const equipmentData = await db.equipment.findUnique({
//     where: { id },
//     include: {
//       loanItems: {
//         include: { loan: true },
//         orderBy: { loan: { startDate: 'desc' } }
//       },
//       maintenanceRecords: { orderBy: { startDate: 'desc' } },
//       logs: {
//         include: { borrowedBy: true },
//         orderBy: { createdAt: 'desc' }
//       }
//     }
//   });

//   if (!equipmentData) return <div>找不到設備</div>;

//   // ... (保留你原本的 equipmentForHistory 轉換邏輯) ...

//   // 翻譯計費方式，用於 UI 顯示
//   const billingText = equipmentData.billingType === "HOURLY" ? "按小時計費" : 
//                       equipmentData.billingType === "DAILY" ? "按天計費" : "免費借用";

//   return (
//     <div className="max-w-4xl mx-auto p-4">
//       <div className="flex items-center justify-between mb-6 border-b pb-4">
//         <div>
//           <h1 className="text-2xl font-bold">{equipmentData.name} 的歷史紀錄</h1>
//           <p className="text-gray-500 mt-1">
//             當前狀態：<span className="font-semibold text-black">{equipmentData.status}</span>
//           </p>
//           {/* 👇 新增顯示計費資訊 */}
//           {equipmentData.billingType !== "NONE" && (
//             <p className="text-sm text-blue-600 mt-1">
//               計費規則：{billingText} (${equipmentData.price})
//             </p>
//           )}
//         </div>
        
//         {/* 👇 將計費資訊傳給 Client Component */}
//         <BorrowEquipmentModal 
//           equipmentId={equipmentData.id} 
//           equipmentName={equipmentData.name}
//           currentStatus={equipmentData.status}
//           billingType={equipmentData.billingType}
//           price={equipmentData.price}
//         />
//       </div>
      
//       <div className="mt-8">
//         {/* <EquipmentHistory equipment={equipmentForHistory} /> */}
//       </div>
//     </div>
//   );
// }


// app/equipment/[id]/page.tsx
import { db } from "@/app/lib/prisma";
import { EquipmentHistory } from "@/components/equipment/equipment-history";
import { BorrowEquipmentModal } from "@/components/equipment/BorrowEquipmentModal";
import { ReturnEquipmentDialog } from "@/components/equipment/ReturnEquipmentDialog";

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
        include: { 
          borrowedBy: { select: { id: true, name: true } },
          project: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!equipmentData) return <div>找不到設備</div>;

  // 整理為歷史時間軸資料
  const history: any[] = [];

  // 借用/歸還紀錄
  for (const log of equipmentData.logs) {
    history.push({
      id: log.id,
      type: log.returnedAt ? "return" : "borrow",
      date: log.borrowedAt,
      endDate: log.returnedAt,
      user: log.borrowedBy?.name || "外部人員",
      project: log.project?.title,
      description: log.notes,
      condition: (log as any).condition,
      totalCost: log.totalCost ? Number(log.totalCost) : null,
    });
  }

  // 維修紀錄
  for (const maintenance of equipmentData.maintenanceRecords) {
    history.push({
      id: maintenance.id,
      type: "maintenance",
      date: maintenance.startDate,
      endDate: maintenance.endDate,
      description: maintenance.description,
      cost: maintenance.cost,
      technician: maintenance.technician,
      typeLabel: maintenance.type,
    });
  }

  // 按日期排序
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const billingText = equipmentData.billingType === "HOURLY" ? "按小時計費" : 
                      equipmentData.billingType === "DAILY" ? "按天計費" : "免費借用";

                      // 在 page.tsx 中，把資料重新映射
const equipmentForHistory = {
  createdAt: equipmentData.createdAt,
  loans: equipmentData.loanItems.map((li) => ({
    id: li.id,
    startDate: li.loan.startDate,
    endDate: li.loan.endDate,
    actualReturnDate: li.returnedAt,
    userId: li.loan.borrowerName || "員工",
  })),
  maintenances: equipmentData.maintenanceRecords,
  logs: equipmentData.logs,
};


  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">{equipmentData.name}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
            <p>
              狀態：<span className="font-semibold text-black">{equipmentData.status}</span>
            </p>
            {equipmentData.model && (
              <p>型號：{equipmentData.model}</p>
            )}
            {equipmentData.serialNumber && (
              <p>序號：{equipmentData.serialNumber}</p>
            )}
            {equipmentData.team && (
              <p>分類：{equipmentData.team}</p>
            )}
            {equipmentData.billingType !== "NONE" && (
              <p className="text-blue-600">{billingText} (${equipmentData.price})</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <BorrowEquipmentModal 
            equipmentId={equipmentData.id} 
            equipmentName={equipmentData.name}
            currentStatus={equipmentData.status}
            billingType={equipmentData.billingType}
            price={equipmentData.price}
          />
        </div>
      </div>
      

      {/* 🆕 使用記錄時間軸 */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">使用記錄</h2>
        <EquipmentHistory equipment={equipmentForHistory} />
      </div>
    </div>
  );
}
