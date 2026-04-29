// // components/sales/chat/chatsidebar.tsx
// "use client";

// import { useState } from "react";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Badge } from "@/components/ui/badge";
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
// import { ChevronDown, ChevronUp, FileCheck, Clock, XCircle, RefreshCw, FileText, ExternalLink } from "lucide-react";
// import { format } from "date-fns";
// import { zhTW } from "date-fns/locale";

// // 定義交付成品類型
// interface DeliverableType {
//   id: string;
//   name: string;
//   url: string;
//   fileKey: string | null;
//   fileSize: number | null;
//   createdAt: Date;
// }

// // 定義版本類型
// interface VersionType {
//   id: string;
//   versionName: string;
//   versionNumber: number;
//   reviewStatus: string;
//   createdAt: Date;
//   phaseId: string | null;
//   user: {
//     id: string;
//     name: string | null;
//   };
// }

// // 定義階段類型（加入 deliverables）
// interface PhaseType {
//   id: string;
//   name: string;
//   selectedVersions: VersionType[];
//   deliverables: DeliverableType[];  // ✅ 新增
// }

// interface ChatSidebarProps {
//   phases: PhaseType[];
//   selectedVersionId: string | null;
//   onVersionSelect: (versionId: string, versionName: string) => void;
//   customerId?: string | null;
// }

// const getStatusIcon = (status: string) => {
//   switch (status) {
//     case "APPROVED":
//       return <FileCheck className="w-3 h-3 text-green-500" />;
//     case "REJECTED":
//       return <XCircle className="w-3 h-3 text-red-500" />;
//     case "REVISING":
//       return <RefreshCw className="w-3 h-3 text-orange-500" />;
//     default:
//       return <Clock className="w-3 h-3 text-yellow-500" />;
//   }
// };

// const getStatusText = (status: string) => {
//   switch (status) {
//     case "APPROVED":
//       return "已通過";
//     case "REJECTED":
//       return "需修改";
//     case "REVISING":
//       return "修改中";
//     default:
//       return "待審核";
//   }
// };

// // 格式化檔案大小
// const formatFileSize = (bytes: number | null | undefined): string => {
//   if (!bytes) return "";
//   if (bytes < 1024) return `${bytes} B`;
//   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
//   if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
//   return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
// };

// export function ChatSidebar({ phases, selectedVersionId, onVersionSelect }: ChatSidebarProps) {
//   const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(() => {
//     const initial: Record<string, boolean> = {};
//     phases.forEach(phase => {
//       initial[phase.id] = true;
//     });
//     return initial;
//   });

//   const togglePhase = (phaseId: string) => {
//     setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
//   };

//   if (!phases || phases.length === 0) {
//     return (
//       <div className="p-4 text-center">
//         <p className="text-sm text-muted-foreground">暫無任何版本</p>
//       </div>
//     );
//   }

//   const totalVersions = phases.reduce((acc, p) => acc + (p.selectedVersions?.length || 0), 0);
//   const totalDeliverables = phases.reduce((acc, p) => acc + (p.deliverables?.length || 0), 0);

//   return (
//     <div className="h-full flex flex-col">
//       <div className="p-4 border-b">
//         <h2 className="font-semibold">專案內容</h2>
//         <p className="text-xs text-muted-foreground mt-1">
//           {totalVersions} 個版本 | {totalDeliverables} 個交付物
//         </p>
//       </div>
      
//       <ScrollArea className="flex-1">
//         <div className="p-3 space-y-2">
//           {phases.map((phase) => {
//             const versions = phase.selectedVersions || [];
//             const deliverables = phase.deliverables || [];
//             const hasContent = versions.length > 0 || deliverables.length > 0;
            
//             if (!hasContent) return null;
            
//             return (
//               <Collapsible
//                 key={phase.id}
//                 open={expandedPhases[phase.id]}
//                 onOpenChange={() => togglePhase(phase.id)}
//               >
//                 <div className="border rounded-lg overflow-hidden">
//                   <CollapsibleTrigger className="w-full">
//                     <div className="p-3 bg-muted/30 hover:bg-muted/50 transition-colors flex justify-between items-center">
//                       <div className="flex-1 text-left">
//                         <h3 className="font-medium text-sm">{phase.name}</h3>
//                         <p className="text-xs text-muted-foreground">
//                           {versions.length} 個版本 | {deliverables.length} 個交付物
//                         </p>
//                       </div>
//                       {expandedPhases[phase.id] ? (
//                         <ChevronUp className="w-4 h-4 text-muted-foreground" />
//                       ) : (
//                         <ChevronDown className="w-4 h-4 text-muted-foreground" />
//                       )}
//                     </div>
//                   </CollapsibleTrigger>
                  
//                   <CollapsibleContent>
//                     <div className="divide-y">
//                       {/* 版本列表 */}
//                       {/* {versions.length > 0 && (
//                         <div className="p-2">
//                           <div className="text-xs font-medium text-muted-foreground mb-2 px-2">📋 工作版本</div>
//                           {versions.map((version) => (
//                             <button
//                               key={version.id}
//                               onClick={() => onVersionSelect(version.id, version.versionName)}
//                               className={`w-full p-2 text-left transition-all hover:bg-muted/30 rounded-md ${
//                                 selectedVersionId === version.id 
//                                   ? "bg-blue-50 border-l-4 border-blue-500" 
//                                   : ""
//                               }`}
//                             >
//                               <div className="flex justify-between items-start mb-1">
//                                 <span className="font-medium text-sm truncate flex-1">
//                                   {version.versionName}
//                                 </span>
//                                 <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
//                                   {getStatusIcon(version.reviewStatus)}
//                                   <span className="ml-1">{getStatusText(version.reviewStatus)}</span>
//                                 </Badge>
//                               </div>
//                               <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
//                                 <span>v{version.versionNumber}</span>
//                                 <span>
//                                   {format(new Date(version.createdAt), "MM/dd HH:mm", { locale: zhTW })}
//                                 </span>
//                               </div>
//                               <div className="text-xs text-muted-foreground mt-1 truncate">
//                                 上傳者：{version.user?.name || "未知"}
//                               </div>
//                             </button>
//                           ))}
//                         </div>
//                       )} */}

//                       {/* ✅ 新增：交付成品列表 */}
//                       {deliverables.length > 0 && (
//                         <div className="p-2">
//                           <div className="text-xs font-medium text-muted-foreground mb-2 px-2">📦 交付成品</div>
//                           {deliverables.map((doc) => (
//                             <a
//                               key={doc.id}
//                               href={doc.url}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="flex items-center justify-between p-2 text-sm rounded-md hover:bg-muted/30 transition-colors group"
//                             >
//                               <div className="flex items-center gap-2 flex-1 min-w-0">
//                                 <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
//                                 <span className="truncate text-sm">{doc.name}</span>
//                                 {doc.fileSize && (
//                                   <span className="text-xs text-muted-foreground flex-shrink-0">
//                                     ({formatFileSize(doc.fileSize)})
//                                   </span>
//                                 )}
//                               </div>
//                               <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
//                             </a>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </CollapsibleContent>
//                 </div>
//               </Collapsible>
//             );
//           })}
//         </div>
//       </ScrollArea>
//     </div>
//   );
// }



//有兩個版本 上 是有小工作版本


// components/sales/chat/chatsidebar.tsx

"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileText, ExternalLink, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

// 定義交付成品類型
interface DeliverableType {
  id: string;
  name: string;
  url: string;
  fileKey: string | null;
  fileSize: number | null;
  createdAt: Date;
}

// 定義階段類型（只包含 deliverables）
interface PhaseType {
  id: string;
  name: string;
  deliverables: DeliverableType[];
}

interface ChatSidebarProps {
  phases: PhaseType[];
  selectedDeliverableId: string | null;
  selectedDeliverableName: string | null;
  onDeliverableSelect: (deliverableId: string, deliverableName: string, phaseName: string) => void;  // ✅ 修改簽名
  customerId?: string | null;
  quotationTitle?: string;  // ✅ 新增
}

// 格式化檔案大小
const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

// 提取檔案名稱（不含路徑）
const getDisplayName = (name: string, url: string): string => {
  if (url.startsWith('http')) {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('figma.com')) return 'Figma 設計稿';
      if (urlObj.hostname.includes('drive.google.com')) return 'Google Drive 文件';
      if (urlObj.hostname.includes('notion.so')) return 'Notion 文件';
      if (urlObj.hostname.includes('miro.com')) return 'Miro 白板';
      return urlObj.hostname.replace('www.', '');
    } catch {
      return name;
    }
  }
  return name;
};

export function ChatSidebar({ 
  phases, 
  selectedDeliverableId, 
  selectedDeliverableName,
  onDeliverableSelect,
  quotationTitle = ""  // ✅ 預設值
}: ChatSidebarProps) {
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    phases.forEach(phase => {
      initial[phase.id] = true;
    });
    return initial;
  });

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  if (!phases || phases.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">暫無任何交付成品</p>
        <p className="text-xs text-muted-foreground mt-2">
          上傳完成品後會顯示在這裡
        </p>
      </div>
    );
  }

  const totalDeliverables = phases.reduce((acc, p) => acc + (p.deliverables?.length || 0), 0);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">交付成品</h2>
        <p className="text-xs text-muted-foreground mt-1">
          共 {totalDeliverables} 個完成品
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          點擊成品可查看詳細資訊並開始對話
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {phases.map((phase) => {
            const deliverables = phase.deliverables || [];
            if (deliverables.length === 0) return null;
            
            return (
              <Collapsible
                key={phase.id}
                open={expandedPhases[phase.id]}
                onOpenChange={() => togglePhase(phase.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger className="w-full">
                    <div className="p-3 bg-muted/30 hover:bg-muted/50 transition-colors flex justify-between items-center">
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-sm">{phase.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {deliverables.length} 個成品
                        </p>
                      </div>
                      {expandedPhases[phase.id] ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="divide-y">
                      {deliverables.map((deliverable) => {
                        // ✅ 組合完整標題：報價單標題 - 階段名稱 - 成品名稱
                        const displayName = quotationTitle 
                          ? `${quotationTitle} - ${phase.name} - ${getDisplayName(deliverable.name, deliverable.url)}`
                          : `${phase.name} - ${getDisplayName(deliverable.name, deliverable.url)}`;
                        
                        return (
                          <button
                            key={deliverable.id}
                            onClick={() => onDeliverableSelect(deliverable.id, deliverable.name, phase.name)}  // ✅ 傳遞 phase.name
                            className={`w-full p-3 text-left transition-all hover:bg-muted/30 ${
                              selectedDeliverableId === deliverable.id 
                                ? "bg-blue-50 border-l-4 border-blue-500" 
                                : ""
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span className="font-medium text-sm truncate" title={displayName}>
                                  {displayName}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                對話
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                              <div className="flex items-center gap-2">
                                {deliverable.fileSize && (
                                  <span>{formatFileSize(deliverable.fileSize)}</span>
                                )}
                                <span>
                                  {format(new Date(deliverable.createdAt), "yyyy/MM/dd", { locale: zhTW })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-blue-500">
                                <ExternalLink className="w-3 h-3" />
                                <span>查看</span>
                              </div>
                            </div>
                            
                            {deliverable.url.startsWith('http') && deliverable.name !== getDisplayName(deliverable.name, deliverable.url) && (
                              <div className="text-xs text-muted-foreground mt-1 truncate">
                                {deliverable.name}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}