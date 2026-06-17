// app/pm/schedule/page.tsx
export const dynamic = "force-dynamic";

import { db } from "@/app/lib/prisma";
import WorkItemsViewer from "@/components/WorkItemsViewer";


export default async function PmSchedulePage() {
  // 1. 先抓出所有員工清單給下拉選單用
  const allStaff = await db.user.findMany({
    select: { id: true, name: true }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">團隊資源管理</h1>
      <WorkItemsViewer 
        initialStaffId={allStaff[0]?.id} // 預設顯示第一個人
        isPmMode={true} 
        staffList={allStaff}
      />
    </div>
  );
}
