// // src/app/projects/[projectId]/_components/PmSalesChatPanel.tsx
// "use client";

// import { useSession } from "next-auth/react";
// import SalesPMChat from "@/components/sales/Message/SalesPMChat";

// type Props = {
//   projectId: string;
//   pmName: string | null;
//   salesName: string | null;
// };

// export default function PmSalesChatPanel({ projectId, pmName, salesName }: Props) {
//   const { data: session } = useSession();

//   if (!session?.user?.id) {
//     return (
//       <div className="border rounded-lg bg-white p-4 text-center text-sm text-muted-foreground">
//         請先登入
//       </div>
//     );
//   }

//   return (
//     <div className="border rounded-lg bg-white overflow-hidden">
//       {/* 面板標題 */}
//       <div className="p-3 border-b bg-gray-50">
//         <h3 className="font-semibold text-sm flex items-center gap-2">
//           <span className="text-lg">💬</span>
//           與 Sales 對話
//         </h3>
//         <p className="text-xs text-muted-foreground mt-0.5">
//           {salesName ? `與 ${salesName} 的即時溝通` : "尚未指派 Sales"}
//         </p>
//       </div>

//       {/* 重用 SalesPMChat，但角色對調：PM 就是 currentUser，Sales 是對方 */}
//       <div className="h-[420px]">
//         <SalesPMChat
//           projectId={projectId}
//           currentUserId={session.user.id}
//           currentUserRole={session.user.role ?? "PM"}
//           pmName={pmName}     // 對方身份的顯示名稱
//           salesName={salesName} // 當前使用者身份顯示名稱
//         />
//       </div>
//     </div>
//   );
// }


// src/app/projects/[projectId]/_components/PmSalesChatPanel.tsx
"use client";

import { useSession } from "next-auth/react";
import SalesPMChat from "@/components/sales/Message/SalesPMChat";

type Props = {
  projectId: string;
  pmName: string | null;
  salesName: string | null;
};

export default function PmSalesChatPanel({ projectId, pmName, salesName }: Props) {
  const { data: session } = useSession();

  if (!session?.user?.id) {
    return (
      <div className="border rounded-lg bg-white p-4 text-center text-sm text-muted-foreground">
        請先登入
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* 面板標題 */}
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span className="text-lg">💬</span>
          與 Sales 對話
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {salesName ? `與 ${salesName} 的即時溝通` : "尚未指派 Sales"}
        </p>
      </div>

      {/* ✅ 對話容器：固定高度 + 超出可滾動，保護整體 UI 結構 */}
      <div className="h-[420px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <SalesPMChat
          projectId={projectId}
          currentUserId={session.user.id}
          currentUserRole={session.user.role ?? "PM"}
          pmName={pmName}
          salesName={salesName}
        />
      </div>
    </div>
  );
}
