// "use client";


// import Link from "next/link";
// import { trpc } from "../../../../trpc/client";

// export default function StaffPage() {

//   // const utils = trpc.useUtils();
//   const { data: staffList, isLoading, isError } = trpc.user.getStaffs.useQuery();

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <h1 className="text-3xl font-bold mb-6 text-gray-800">員工管理系統</h1>

//       <Link href="/admin/staff/createstaff" className="inline-block mb-4 px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800">
//           建立員工
//       </Link>

//       <div className="grid gap-4 mt-4">
//         <h2 className="text-xl font-semibold text-gray-700 mb-2">員工列表</h2>

//         {isLoading && <div className="p-10 text-center">載入中...</div>}
//         {isError && <div className="p-10 text-center text-red-500">載入失敗</div>}

//         {!isLoading && staffList?.length === 0 && (
//            <div className="p-10 text-center text-gray-500 bg-gray-50 rounded">目前沒有員工</div>
//         )}

//         {!isLoading && staffList?.map((staff) => {
          
//           // 🔥 邏輯判斷：只有當職位存在 且 職位狀態為 true 時，才視為有效
//           // 注意：如果你的 TS 報錯說 position 沒有 isActive，請檢查 Prisma schema 是否已 push 並且後端 router 是否有 include
//           const hasActivePosition = staff.position && staff.position.isActive;

//           return (
//             <div
//               key={staff.id}
//               className="border border-gray-200 p-4 rounded-lg shadow-sm flex justify-between items-center bg-white hover:shadow-md transition-shadow"
//             >
//               <div>
//                 <div className="flex items-center gap-2">
//                   <p className="font-bold text-lg text-gray-900">{staff.name}</p>
                  
//                   {/* 🔥 修改這裡的顯示邏輯 */}
//                   {hasActivePosition ? (
//                       // 情況 A: 有職位 且 啟用中 -> 顯示紫色正常標籤
//                       <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
//                           {staff.position?.name}
//                       </span>
//                   ) : (
//                       // 情況 B: 沒職位 或 職位已禁用 -> 顯示灰色無效狀態
//                       <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
//                           {/* 如果有職位但被禁用了，顯示「已失效」，否則顯示「未分配」 */}
//                           {staff.position ? `${staff.position.name} (已停用)` : "未分配職位"}
//                       </span>
//                   )}
//                 </div>

//                 {/* 顯示系統角色 */}
//                 <div className="mt-1">
//                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border">
//                       {staff.role}
//                    </span>
//                 </div>
//               </div>

//               <div className="flex gap-2">
//                 <Link 
//                   href={`/admin/staff/${staff.id}`}
//                   className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition text-sm"
//                 >
//                   編輯
//                 </Link>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

//src/app/admin/staff/page.tsx


"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "../../../../trpc/client";

export default function StaffPage() {
  // Add serach function - 1. 加入搜尋狀態（純前端）
  const [searchTerm, setSearchTerm] = useState("");

  const { data: staffList, isLoading, isError } = trpc.user.getStaffs.useQuery();

  // Add serach function - 2. 純前端搜尋篩選邏輯
  const filteredStaff = staffList?.filter((staff) => {
    const search = searchTerm.toLowerCase();
    const name = staff.name?.toLowerCase() || "";
    const role = staff.role?.toLowerCase() || "";
    const positionName = staff.position?.name?.toLowerCase() || "";

    // 只要符合姓名 / 角色 / 職位任一就顯示
    return name.includes(search) || role.includes(search) || positionName.includes(search);
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">員工管理系統</h1>

      <Link
        href="/admin/staff/createstaff"
        className="inline-block mb-4 px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800"
      >
        建立員工
      </Link>

      {/* Add serach function - 3. 加入搜尋輸入框 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜尋員工姓名、角色、職位..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-4 mt-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">員工列表</h2>

        {isLoading && <div className="p-10 text-center">載入中...</div>}
        {isError && <div className="p-10 text-center text-red-500">載入失敗</div>}

        {!isLoading && filteredStaff?.length === 0 && (
          <div className="p-10 text-center text-gray-500 bg-gray-50 rounded">
            {searchTerm ? "沒有找到符合的員工" : "目前沒有員工"}
          </div>
        )}

        {!isLoading &&
          filteredStaff?.map((staff) => {
            const hasActivePosition = staff.position && staff.position.isActive;

            return (
              <div
                key={staff.id}
                className="border border-gray-200 p-4 rounded-lg shadow-sm flex justify-between items-center bg-white hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg text-gray-900">{staff.name}</p>

                    {hasActivePosition ? (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        {staff.position?.name}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                        {staff.position ? `${staff.position.name} (已停用)` : "未分配職位"}
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border">
                      {staff.role}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/staff/${staff.id}`}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition text-sm"
                  >
                    編輯
                  </Link>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}