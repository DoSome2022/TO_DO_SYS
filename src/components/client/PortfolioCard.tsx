// components/client/PortfolioCard.tsx

"use client";

import Link from "next/link";

type ProjectProps = {
  project: {
    id: string;
    title: string;
    description?: string | null;
  };
  isLoggedIn: boolean;
  showReferencePrice?: number | null; // 🆕
};

export function PortfolioCard({
  project,
  isLoggedIn,
  showReferencePrice,
}: ProjectProps) {
  return (
    <div className="border border-neutral-800 bg-neutral-900 rounded-lg p-6 hover:border-neutral-700 transition-colors flex flex-col justify-between h-full">
      <div>
        <h3 className="text-2xl font-bold text-neutral-100 mb-3">
          {project.title}
        </h3>
        {project.description && (
          <p className="text-neutral-400 mb-4 line-clamp-3">
            {project.description}
          </p>
        )}

        {/* 🆕 參考預算 */}
        {showReferencePrice && (
          <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded inline-block">
            參考預算 ${showReferencePrice.toLocaleString()} 起
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-800">
        {isLoggedIn ? (
          <Link
            href={`/customer/apply?referenceId=${project.id}`}
            className="inline-block w-full text-center px-4 py-2 bg-neutral-800 text-amber-500 hover:bg-neutral-700 hover:text-amber-400 transition-colors rounded"
          >
            以此風格發起合作
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="inline-block w-full text-center px-4 py-2 bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors rounded"
          >
            登入後發起合作
          </Link>
        )}
      </div>
    </div>
  );
}
