// app/projects/_components/ProjectCard.tsx
"use client";

import Link from "next/link";
import { Folder, MoreHorizontal, Clock } from "lucide-react";

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string | null;
  progress: number; // 例如 0~100
  dueDate?: Date | null;
}

export default function ProjectCard({ id, name, description, progress, dueDate }: ProjectCardProps) {
  return (
    <Link href={`/projects/${id}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-md p-5 hover:shadow-md transition-shadow duration-200 relative">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
              {name}
            </h3>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">
          {description || "尚未新增專案描述..."}
        </p>

        {/* 進度條 (微軟風格通常是細長且直覺的) */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs text-gray-600 font-medium">
            <span>專案進度</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center text-xs text-gray-500 border-t border-gray-100 pt-3 mt-2">
          <Clock className="w-3.5 h-3.5 mr-1" />
          <span>截止日: {dueDate ? new Date(dueDate).toLocaleDateString() : '未設定'}</span>
        </div>
      </div>
    </Link>
  );
}
