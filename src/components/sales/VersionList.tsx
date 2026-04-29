// components/sales/VersionList.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileCheck, Clock, XCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface Version {
  id: string;
  versionName: string;
  versionNumber: number;
  reviewStatus: string;
  createdAt: Date;
  user: {
    name: string | null;
  };
  phaseName?: string;
  phaseId?: string;
}

interface Phase {
  id: string;
  name: string;
  status: string;
  selectedVersions: Version[];
  deliverables?: any[];
}

interface VersionListProps {
  phases: Phase[];
  selectedVersionId: string | null;
  onVersionSelect: (versionId: string, versionName: string) => void;
  customerId?: string | null;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "APPROVED":
      return <FileCheck className="w-4 h-4 text-green-500" />;
    case "REJECTED":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "REVISING":
      return <RefreshCw className="w-4 h-4 text-orange-500" />;
    default:
      return <Clock className="w-4 h-4 text-yellow-500" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "已通過";
    case "REJECTED":
      return "需修改";
    case "REVISING":
      return "修改中";
    default:
      return "待審核";
  }
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    case "REVISING":
      return "secondary";
    default:
      return "outline";
  }
};

export function VersionList({ phases, selectedVersionId, onVersionSelect, customerId }: VersionListProps) {
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    phases.forEach(phase => {
      initial[phase.id] = true; // 預設全部展開
    });
    return initial;
  });

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  if (phases.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">暫無任何版本</p>
          <p className="text-sm text-muted-foreground mt-2">
            當員工上傳工作版本後，會顯示在這裡
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-semibold">專案版本</CardTitle>
        <p className="text-sm text-muted-foreground">
          共 {phases.reduce((acc, p) => acc + p.selectedVersions.length, 0)} 個版本
        </p>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {phases.map((phase) => (
              <Collapsible
                key={phase.id}
                open={expandedPhases[phase.id]}
                onOpenChange={() => togglePhase(phase.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger className="w-full">
                    <div className="p-3 bg-muted/30 hover:bg-muted/50 transition-colors flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{phase.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {phase.selectedVersions.length} 個版本
                        </p>
                      </div>
                      {expandedPhases[phase.id] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="divide-y">
                      {phase.selectedVersions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => onVersionSelect(version.id, version.versionName)}
                          className={`w-full p-3 text-left transition-colors hover:bg-muted/30 ${
                            selectedVersionId === version.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">
                              {version.versionName}
                            </span>
                            <Badge variant={getStatusVariant(version.reviewStatus)} className="text-xs">
                              {getStatusIcon(version.reviewStatus)}
                              <span className="ml-1">{getStatusText(version.reviewStatus)}</span>
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                            <span>v{version.versionNumber}</span>
                            <span>
                              {format(new Date(version.createdAt), "yyyy/MM/dd HH:mm", { locale: zhTW })}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            上傳者：{version.user.name || "未知"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}