"use client";
import { cn } from "@/lib/utils"; // shadcn 內建工具

export function VersionListSidebar({ versions, selectedId, onSelect }: any) {
  if (versions.length === 0) return <div className="text-sm text-center mt-4">尚無提交紀錄</div>;

  return (
    <div className="space-y-2">
      {versions.map((v: any) => (
        <button
          key={v.id}
          onClick={() => onSelect(v.id)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
            selectedId === v.id 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-muted text-foreground"
          )}
        >
          <div className="font-medium">{v.versionName}</div>
          <div className="text-xs opacity-70 mt-1">
            {new Date(v.createdAt).toLocaleDateString()}
          </div>
        </button>
      ))}
    </div>
  );
}
