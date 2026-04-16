"use client";
// components/client/PortfolioCard.tsx
import Link from "next/link";

type ProjectProps = {
  project: {
    id: string;
    title: string;
    description?: string | null;
  };
  // 新增這個 Prop 來接收登入狀態
  isLoggedIn: boolean; 
};

export function PortfolioCard({ project, isLoggedIn }: ProjectProps) {
  return (
    <div className="border border-neutral-800 bg-neutral-900 rounded-lg p-6 hover:border-neutral-700 transition-colors flex flex-col justify-between h-full">
      <div>
        <h3 className="text-2xl font-bold text-neutral-100 mb-3">{project.title}</h3>
        {project.description && (
          <p className="text-neutral-400 mb-6 line-clamp-3">{project.description}</p>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-neutral-800">
        {/* 判斷：如果已登入，顯示合作按鈕；如果未登入，顯示引導登入按鈕 (或直接隱藏) */}
        {isLoggedIn ? (
          <Link 
            href={`/customer/apply?referenceId=${project.id}`}
            className="inline-block w-full text-center px-4 py-2 bg-neutral-800 text-amber-500 hover:bg-neutral-700 hover:text-amber-400 transition-colors rounded"
          >
            以此風格發起合作
          </Link>
        ) : (
          <Link 
            href="/auth/login" // 引導未登入的使用者去登入
            className="inline-block w-full text-center px-4 py-2 bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors rounded"
          >
            登入後發起合作
          </Link>
          
          // 備註：如果您想要「完全隱藏」不讓未登入的人看到任何按鈕，
          // 可以直接改成 null，例如：
          // null
        )}
      </div>
    </div>
  );
}
