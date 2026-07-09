// src/components/client/CategorySection.tsx
"use client";

import { useState } from "react";
import { PortfolioCard } from "./PortfolioCard";
import { ChevronDown, ChevronUp, DollarSign, Tag } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Props {
  category: string;
  products: Array<{
    id: string;
    productName: string;
    productDescription?: string | null;
    referencePrice?: number | null;
  }>;
  isLoggedIn: boolean;
}

export function CategorySection({ category, products, isLoggedIn }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      {/* 分類標題 */}
      <div
        className="flex items-center gap-3 mb-8 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="text-3xl font-bold text-neutral-200 group-hover:text-amber-500 transition-colors">
          {category}
        </h2>
        <span className="text-sm text-neutral-600 bg-neutral-900 px-2 py-0.5 rounded-full">
          {products.length}
        </span>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-600" />
        )}
      </div>

      {/* 商品列表 */}
      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <HoverCard key={product.id} openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div className="cursor-pointer">
                  <PortfolioCard
                    project={{
                      id: product.id,
                      title: product.productName,
                      description: product.productDescription,
                    }}
                    isLoggedIn={isLoggedIn}
                    showReferencePrice={product.referencePrice}
                  />
                </div>
              </HoverCardTrigger>

              {/* 🆕 懸停彈出視窗 — 顯示商品細節 */}
             <HoverCardContent
  side="right"
  sideOffset={16}
  align="start"
  className="w-96 bg-neutral-900 border-neutral-700 text-neutral-100 p-5 shadow-2xl"
>
  {/* 商品名稱 */}
  <h3 className="text-lg font-bold text-amber-500 mb-2">
    {product.productName}
  </h3>

  {/* 商品描述 */}
  {product.productDescription && (
    <p className="text-sm text-neutral-400 mb-4 line-clamp-3">
      {product.productDescription}
    </p>
  )}

  {/* 參考預算 */}
  {product.referencePrice && (
    <div className="flex items-center gap-2 p-3 bg-neutral-950 rounded-lg border border-neutral-800 mb-4">
      <DollarSign className="w-5 h-5 text-amber-500 shrink-0" />
      <div>
        <p className="text-xs text-neutral-500">參考預算</p>
        <p className="text-base font-bold text-amber-400">
          ${product.referencePrice.toLocaleString()} 起
        </p>
      </div>
    </div>
  )}

  {/* 🆕 同類商品 */}
  {products.length > 1 && (
    <div>
      <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1">
        <Tag className="w-3 h-3" />
        同類型作品（{products.length}）
      </p>
      <div className="flex flex-wrap gap-2">
        {products
          .filter((p) => p.id !== product.id)
          .slice(0, 3)
          .map((sibling) => (
            <span
              key={sibling.id}
              className="text-xs px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-neutral-400"
            >
              {sibling.productName}
            </span>
          ))}
      </div>
    </div>
  )}

  <p className="text-xs text-neutral-600 mt-3 text-center">
    點擊卡片查看詳情與申請合作
  </p>
</HoverCardContent>

            </HoverCard>
          ))}
        </div>
      )}
    </div>
  );
}
