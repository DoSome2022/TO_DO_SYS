// src/components/SalesProjectList.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, FolderOpen, User, MessageSquare, FileText,
} from "lucide-react";

import { format } from "date-fns";
import { useSalesProjects } from "../../../../hooks/useProjectChat";

export default function SalesProjectList() {
  const { data: projects, isLoading } = useSalesProjects();
  const router = useRouter();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <FolderOpen className="w-6 h-6 text-blue-600" />
        我負責的專案
      </h2>

      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>目前沒有負責的專案</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/sales/projects/${project.id}/chat`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description || "無描述"}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        客戶：{project.customer?.name || "未知"}
                      </span>
                      {project.pm && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-green-600" />
                          PM：{project.pm.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        版本數：{project.quotation?.versions.length || 0}
                      </span>
                      <span>
                        更新於 {format(new Date(project.updatedAt), "yyyy/MM/dd")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={project.pm ? "default" : "secondary"}>
                      {project.pm ? "已指派PM" : "待指派PM"}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      對話
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
