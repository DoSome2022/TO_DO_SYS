// app/admin/positions/page.tsx

"use client"; // <--- 1. 必須加上這行，變成 Client Component


import StaffPositionForm from "@/components/admin/positions/staffPositionForm";
import { trpc } from "../../../../trpc/client"; // 引用你的 client

export default function StaffPositionPage() {
  // 2. 改用 Hooks (useQuery) 而不是 await ... query()
  // 這些會在瀏覽器端並行發送請求
  const positionsQuery = trpc.staffPosition.getAllstaffPosition.useQuery();
  const featuresQuery = trpc.dynamicFeature.getAll.useQuery();
  // 注意：如果 permission 也是從 staffPosition 拿，那就不用多抓一次，或者你需要確認 permission 的 router
  // 假設你有一個 permission router:
  const permissionsQuery = trpc.staffPermission.getAll.useQuery(); 

  // 3. 處理載入中狀態 (因為是在前端抓，會有短暫的 Loading)
  if (positionsQuery.isLoading || featuresQuery.isLoading) {
    return <div className="p-10 text-center">正在載入資料...</div>;
  }
  
  // 4. 處理錯誤
  if (positionsQuery.error || featuresQuery.error) {
    return <div className="p-10 text-red-500">載入失敗</div>;
  }

  const positions = positionsQuery.data || [];
  const features = featuresQuery.data || [];
  const permissions = permissionsQuery.data || [];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">職位管理系統</h1>
      
      {/* 5. 把資料傳給 Client Component */}
      {/* 這裡假設 positions 裡面包含了 permissions 資訊，根據你的 API 回傳調整 */}
      <StaffPositionForm 
        initialFeatures={features}
        initialPermissions={permissions} // ✅ 補上這個屬性
        // 如果你的 Form 需要 permission 列表，這裡要傳入
        // initialPermissions={permissions} 
      />

      {/* 現有職位列表 */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">現有職位列表</h2>
        <ul className="space-y-4"> {/* 加大一點間距 */}
          {positions.map((p: any) => (
            <li key={p.id} className="p-4 border rounded bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="font-bold text-lg text-gray-800">{p.name}</span>
              
              <div className="flex flex-col text-sm text-gray-600 sm:text-right gap-1">
                {/* 🔥 顯示權限名稱 */}
                <p>
                  <span className="font-semibold text-gray-700">擁有權限：</span>
                  {p.permissions && p.permissions.length > 0 
                    ? p.permissions.map((perm: any) => perm.name).join("、") 
                    : <span className="text-gray-400">無</span>
                  }
                </p>

                {/* 如果你也想顯示功能(Features)名稱，可以取消這段註解 */}
                {/* 
                <p>
                  <span className="font-semibold text-gray-700">可用功能：</span>
                  {p.features && p.features.length > 0 
                    ? p.features.map((feature: any) => feature.name).join("、") 
                    : <span className="text-gray-400">無</span>
                  }
                </p> 
                */}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
