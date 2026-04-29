// // app/sales/ChatList/ChatListClient.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { api } from "@/utils/api";
// import { ChatSidebar } from "@/components/sales/chat/chatsidebar";
// import { MessageCircle, FolderOpen } from "lucide-react";
// import { ChatArea } from "@/components/sales/chat/ChatArea";

// interface ChatListClientProps {
//   projectId: string;
//   customerId: string;
// }

// // 修正：讓 customer 可以為 null

// interface Deliverable {
//   id: string;
//   name: string;
//   url: string;
//   fileKey: string | null;
//   fileSize: number | null;
//   createdAt: Date;
// }

// interface Version {
//   id: string;
//   versionName: string;
//   versionNumber: number;
//   reviewStatus: string;
//   createdAt: Date;
//   user: {
//     id: string;
//     name: string | null;
//   };
// }

// interface Phase {
//   id: string;
//   name: string;
//   selectedVersions: Version[];
//   deliverables: Deliverable[];  // ✅ 新增
// }

// interface ProjectWithVersions {
//   id: string;
//   title: string;
//   status: string;
//   customerId: string | null;
//   customer: {
//     id: string;
//     name: string | null;
//     companyname: string | null;
//   } | null;
//   phases: Phase[];
// }

// export function ChatListClient({ projectId, customerId }: ChatListClientProps) {
//   const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
//   const [selectedVersionName, setSelectedVersionName] = useState<string>("");
//   const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId);
//   const [selectedProjectTitle, setSelectedProjectTitle] = useState<string>("");

//   // 如果有 projectId，直接獲取該專案的階段
//   const { 
//     data: phases, 
//     isLoading: phasesLoading, 
//     error: phasesError 
//   } = api.phase.getPhasesByProjectId.useQuery(
//     { projectId: selectedProjectId },
//     { enabled: !!selectedProjectId }
//   );

//   // 如果沒有 projectId，但有 customerId，獲取客戶的所有專案
//   const { 
//     data: customerData, 
//     isLoading: projectsLoading 
//   } = api.customer.getCustomerProjectsWithVersions.useQuery(
//     { customerId },
//     { enabled: !!customerId && !selectedProjectId }
//   );

//   // 處理專案選擇
//   const handleProjectSelect = (projectId: string, projectTitle: string) => {
//     setSelectedProjectId(projectId);
//     setSelectedProjectTitle(projectTitle);
//     setSelectedVersionId(null);
//     setSelectedVersionName("");
//   };

//   // 收集所有版本
//   const allVersions = (phases || []).flatMap((phase: any) => 
//     (phase.selectedVersions || []).map((version: any) => ({
//       id: version.id,
//       versionName: version.versionName,
//       versionNumber: version.versionNumber,
//       reviewStatus: version.reviewStatus,
//       createdAt: version.createdAt,
//       phaseId: phase.id,
//       phaseName: phase.name,
//       user: {
//         id: version.user.id,
//         name: version.user.name,
//       },
//     }))
//   );

//   // 自動選擇第一個版本
//   useEffect(() => {
//     if (allVersions.length > 0 && !selectedVersionId) {
//       const firstVersion = allVersions[0];
//       setSelectedVersionId(firstVersion.id);
//       setSelectedVersionName(firstVersion.versionName);
//     }
//   }, [allVersions, selectedVersionId]);

//   const handleVersionSelect = (versionId: string, versionName: string) => {
//     setSelectedVersionId(versionId);
//     setSelectedVersionName(versionName);
//   };

//   // 載入狀態
//   const isLoading = (!selectedProjectId && projectsLoading) || (selectedProjectId && phasesLoading);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   // 錯誤狀態
//   if (phasesError) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <Card className="p-8 text-center">
//           <p className="text-red-600">載入失敗：{phasesError.message}</p>
//         </Card>
//       </div>
//     );
//   }

//   // 沒有 projectId，顯示專案選擇畫面
//   if (!selectedProjectId) {
//     const projects = customerData?.projects || [];
    
//     if (projects.length === 0) {
//       return (
//         <div className="flex items-center justify-center h-screen">
//           <Card className="p-8 text-center max-w-md">
//             <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
//             <p className="text-muted-foreground">此客戶尚無任何已成交的專案</p>
//             <p className="text-sm text-muted-foreground mt-2">
//               請先將報價單轉為專案，才能開始對話
//             </p>
//             {customerData?.quotations && customerData.quotations.length > 0 && (
//               <div className="mt-4 text-sm">
//                 <p className="font-medium">有 {customerData.quotations.length} 張已成交的報價單</p>
//                 <p className="text-muted-foreground">請先將報價單轉為專案</p>
//               </div>
//             )}
//           </Card>
//         </div>
//       );
//     }

//     return (
//       <div className="container mx-auto p-6">
//         <h1 className="text-2xl font-bold mb-6">選擇專案</h1>
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//           {projects.map((project: any) => {
//             // 安全地獲取客戶名稱
//             const customerName = project.customer?.companyname || project.customer?.name || "未知客戶";
//             // 計算版本總數
//             const totalVersions = project.phases?.reduce(
//               (acc: number, p: any) => acc + (p.selectedVersions?.length || 0), 
//               0
//             ) || 0;
            
//             return (
//               <div 
//                 key={project.id}
//                 className="cursor-pointer hover:shadow-lg transition-shadow"
//                 onClick={() => handleProjectSelect(project.id, project.title)}
//               >
//                 <Card className="p-6">
//                   <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
//                   <p className="text-sm text-muted-foreground mb-4">
//                     客戶：{customerName}
//                   </p>
//                   <div className="flex justify-between items-center text-sm">
//                     <span className="text-muted-foreground">
//                       版本數：{totalVersions}
//                     </span>
//                     <span className="text-blue-600">開始對話 →</span>
//                   </div>
//                 </Card>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     );
//   }

//   // 無版本
//   if (allVersions.length === 0) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <Card className="p-8 text-center">
//           <p className="text-muted-foreground">此專案暫無任何版本</p>
//           <p className="text-sm text-muted-foreground mt-2">
//             當員工上傳工作版本後，即可開始對話
//           </p>
//           <Button 
//             variant="outline" 
//             className="mt-4"
//             onClick={() => setSelectedProjectId("")}
//           >
//             返回選擇專案
//           </Button>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen flex flex-col">
//       {/* 頂部標題列 */}
//       <div className="border-b bg-white px-6 py-4">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-xl font-semibold">專案對話</h1>
//             <p className="text-sm text-muted-foreground mt-1">
//               專案：{selectedProjectTitle}
//             </p>
//           </div>
//           <Button 
//             variant="outline" 
//             size="sm"
//             onClick={() => setSelectedProjectId("")}
//           >
//             切換專案
//           </Button>
//         </div>
//       </div>

//       {/* 主要內容區 - 左右分欄 */}
//       <div className="flex-1 flex overflow-hidden">
//         {/* 左側：版本列表 */}
//         <div className="w-80 border-r flex-shrink-0 overflow-y-auto">
//           <ChatSidebar
//             phases={phases || []}
//             selectedVersionId={selectedVersionId}
//             onVersionSelect={handleVersionSelect}
//             customerId={customerId}
//           />
//         </div>

//         {/* 右側：對話區域 */}
//         <div className="flex-1 overflow-hidden">
//           {selectedVersionId ? (
//             <ChatArea
//               versionId={selectedVersionId}
//               versionName={selectedVersionName}
//               customerId={customerId}
//             />
//           ) : (
//             <div className="flex items-center justify-center h-full">
//               <Card className="p-8 text-center">
//                 <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
//                 <p className="text-muted-foreground">請選擇左側的版本開始對話</p>
//               </Card>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


//有兩個版本 上 是有小工作版本

// app/sales/ChatList/ChatListClient.tsx

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { ChatSidebar } from "@/components/sales/chat/chatsidebar";
import { ChatArea } from "@/components/sales/chat/ChatArea";
import { MessageCircle, FolderOpen } from "lucide-react";

interface ChatListClientProps {
  projectId: string;
  customerId: string;
}

interface Deliverable {
  id: string;
  name: string;
  url: string;
  fileKey: string | null;
  fileSize: number | null;
  createdAt: Date;
}

interface Phase {
  id: string;
  name: string;
  deliverables: Deliverable[];
}

interface Project {
  id: string;
  title: string;
  phases: Phase[];
  customer: {
    name: string | null;
    companyname: string | null;
  } | null;
}

export function ChatListClient({ projectId, customerId }: ChatListClientProps) {
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null);
  const [selectedDeliverableName, setSelectedDeliverableName] = useState<string>("");
  const [selectedDeliverableUrl, setSelectedDeliverableUrl] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId);
  const [selectedProjectTitle, setSelectedProjectTitle] = useState<string>("");
  
  // ✅ 新增：儲存選中的階段名稱
  const [selectedPhaseName, setSelectedPhaseName] = useState<string>("");

  // ✅ 新增：獲取客戶資訊（包含報價單）
  const { data: customerInfo } = api.customer.getCustomerInfo.useQuery(
    { customerId },
    { enabled: !!customerId }
  );

  // 如果有 projectId，直接獲取該專案的階段（包含 deliverables）
  const { 
    data: phases, 
    isLoading: phasesLoading, 
    error: phasesError 
  } = api.phase.getPhasesByProjectId.useQuery(
    { projectId: selectedProjectId },
    { enabled: !!selectedProjectId }
  );

  // 如果沒有 projectId，但有 customerId，獲取客戶的所有專案
  const { 
    data: customerData, 
    isLoading: projectsLoading 
  } = api.customer.getCustomerProjectsWithVersions.useQuery(
    { customerId },
    { enabled: !!customerId && !selectedProjectId }
  );

  // 處理專案選擇
  const handleProjectSelect = (projectId: string, projectTitle: string) => {
    setSelectedProjectId(projectId);
    setSelectedProjectTitle(projectTitle);
    setSelectedDeliverableId(null);
    setSelectedDeliverableName("");
    setSelectedDeliverableUrl("");
    setSelectedPhaseName("");
  };

  // ✅ 修改：處理交付成品選擇，同時記錄階段名稱
  const handleDeliverableSelect = (deliverableId: string, deliverableName: string, phaseName: string) => {
    setSelectedDeliverableId(deliverableId);
    setSelectedDeliverableName(deliverableName);
    setSelectedPhaseName(phaseName);
    
    // 從 allDeliverables 中找到對應的 URL
    const deliverable = allDeliverables.find(d => d.id === deliverableId);
    if (deliverable) {
      setSelectedDeliverableUrl(deliverable.url);
    }
  };

  // 收集所有交付成品
  const allDeliverables = (phases || []).flatMap((phase: any) => 
    (phase.deliverables || []).map((deliverable: any) => ({
      ...deliverable,
      phaseName: phase.name,
    }))
  );

  // 自動選擇第一個交付成品
  useEffect(() => {
    if (allDeliverables.length > 0 && !selectedDeliverableId) {
      const first = allDeliverables[0];
      setSelectedDeliverableId(first.id);
      setSelectedDeliverableName(first.name);
      setSelectedDeliverableUrl(first.url);
      setSelectedPhaseName(first.phaseName);
    }
  }, [allDeliverables, selectedDeliverableId]);

  // ✅ 獲取最新的報價單標題
  const getQuotationTitle = () => {
    const latestQuotation = customerInfo?.quotations?.[0];
    return latestQuotation?.title || selectedProjectTitle || "專案";
  };

  const isLoading = (!selectedProjectId && projectsLoading) || (selectedProjectId && phasesLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (phasesError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 text-center">
          <p className="text-red-600">載入失敗：{phasesError.message}</p>
        </Card>
      </div>
    );
  }

  // 沒有 projectId，顯示專案選擇畫面
  if (!selectedProjectId) {
    const projects = customerData?.projects || [];
    
    if (projects.length === 0) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Card className="p-8 text-center max-w-md">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">此客戶尚無任何已交付的成品</p>
            <p className="text-sm text-muted-foreground mt-2">
              PM 上傳完成品後會顯示在這裡
            </p>
          </Card>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">選擇專案</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: Project) => {
            const totalDeliverables = project.phases?.reduce(
              (acc, p) => acc + (p.deliverables?.length || 0), 
              0
            ) || 0;
            
            return (
              <div 
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleProjectSelect(project.id, project.title)}
              >
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    客戶：{project.customer?.companyname || project.customer?.name || "未知"}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      交付成品：{totalDeliverables} 個
                    </span>
                    <span className="text-blue-600">開始對話 →</span>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 無交付成品
  if (allDeliverables.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">此專案暫無任何交付成品</p>
          <p className="text-sm text-muted-foreground mt-2">
            PM 上傳完成品後即可開始對話
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setSelectedProjectId("")}
          >
            返回選擇專案
          </Button>
        </Card>
      </div>
    );
  }

  const quotationTitle = getQuotationTitle();
  const fullTitle = `${quotationTitle} - ${selectedPhaseName} - ${selectedDeliverableName}`;

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">交付成品討論</h1>
            <p className="text-sm text-muted-foreground mt-1">
              專案：{selectedProjectTitle}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedProjectId("")}
          >
            切換專案
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左側：交付成品列表 */}
        <div className="w-80 border-r flex-shrink-0 overflow-y-auto">
          <ChatSidebar
            phases={phases || []}
            selectedDeliverableId={selectedDeliverableId}
            selectedDeliverableName={selectedDeliverableName}
            onDeliverableSelect={handleDeliverableSelect}
            customerId={customerId}
            quotationTitle={quotationTitle}  // ✅ 新增傳遞
          />
        </div>

        {/* 右側：對話區域 */}
        <div className="flex-1 overflow-hidden">
          {selectedDeliverableId ? (
            <ChatArea
              deliverableId={selectedDeliverableId}
              deliverableName={fullTitle}  // ✅ 傳遞完整標題
              deliverableUrl={selectedDeliverableUrl}
              customerId={customerId}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">請選擇左側的交付成品開始對話</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}