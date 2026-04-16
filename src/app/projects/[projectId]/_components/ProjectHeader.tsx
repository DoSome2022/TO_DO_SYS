"use client";

import Link from "next/link";
import { ChevronRight, Calendar, Activity } from "lucide-react";
import type { Project } from "@prisma/client";
// 1. 引入 date-fns 的 format 函數
import { format } from "date-fns"; 

export default function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 max-w-7xl py-4">
        
        {/* 麵包屑導航 */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Link href="/projects" className="hover:text-blue-600 transition-colors">
            專案列表
          </Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-gray-900 font-medium truncate max-w-[200px]">
            {project.title}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* 專案標題與描述 */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {project.title}
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${
                project.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                project.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {project.status || '進行中'}
              </span>
            </h1>
            {project.description && (
              <p className="text-gray-500 mt-1 text-sm max-w-2xl">
                {project.description}
              </p>
            )}
          </div>

          {/* 右側資訊區塊 */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">截止日期</p>
                <p className="font-medium">
                  {/* 2. 將 toLocaleDateString() 改為 date-fns 的 format() */}
                  {project.endDate 
                    ? format(new Date(project.endDate), 'yyyy/MM/dd') 
                    : '未設定'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pl-6 border-l">
              <Activity className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">專案負責人</p>
                {/* 假設 User 關聯還沒撈，暫時寫死或顯示 */}
                <p className="font-medium">Admin / PM</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
