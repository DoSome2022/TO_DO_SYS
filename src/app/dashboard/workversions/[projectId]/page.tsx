// app/staff/projects/[projectId]/page.tsx

import { VersionDashboard } from "../_components/VersionDashboard";


// Server Component (負責處理路由與 Metadata)
export default async function ProjectVersionPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  // Next.js 15+ 規範：params 必須被 await
  const resolvedParams = await params;
  const { projectId } = resolvedParams;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4 px-4">
        <h1 className="text-2xl font-bold tracking-tight">專案版本控制台</h1>
        <p className="text-muted-foreground">在此管理您為此專案上傳的所有產出版本，並提交給 PM 審核。</p>
      </div>
      
      {/* 掛載 Client Component (四宮格畫板) */}
      <VersionDashboard projectId={projectId} />
    </div>
  );
}
