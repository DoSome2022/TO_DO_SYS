// app/staff/projects/page.tsx

import { StaffProjectList } from "./_components/ProjectList";

export default function StaffProjectsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">我的專案</h1>
        <p className="text-muted-foreground">選擇一個專案以進入版本與檔案管理。</p>
      </div>
      
      {/* 掛載 Client Component (獲取列表) */}
      <StaffProjectList />
    </div>
  );
}
