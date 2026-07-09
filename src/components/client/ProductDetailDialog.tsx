"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DollarSign, Tag } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  isLoggedIn: boolean;
}

export function ProductDetailDialog({
  open,
  onOpenChange,
  product,
  isLoggedIn,
}: Props) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-800 text-neutral-100">
        <DialogHeader>
          <DialogTitle className="text-2xl text-amber-500">
            {product.productName}
          </DialogTitle>
          {product.productDescription && (
            <DialogDescription className="text-neutral-400 text-base mt-2">
              {product.productDescription}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 參考預算 */}
          {product.referencePrice && (
            <div className="flex items-center gap-3 p-4 bg-neutral-950 rounded-lg border border-neutral-800">
              <DollarSign className="w-6 h-6 text-amber-500" />
              <div>
                <p className="text-sm text-neutral-500">參考預算</p>
                <p className="text-xl font-bold text-amber-400">
                  ${product.referencePrice.toLocaleString()} 起
                </p>
              </div>
            </div>
          )}

          {/* 其他同分類商品 */}
          {product.siblings && product.siblings.length > 0 && (
            <div>
              <p className="text-sm text-neutral-500 mb-3">
                同類型作品（{product.siblings.length}）
              </p>
              <div className="grid grid-cols-2 gap-3">
                {product.siblings.map((sibling: any) => (
                  <div
                    key={sibling.id}
                    className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-sm"
                  >
                    <p className="text-neutral-300">{sibling.productName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 行動按鈕 */}
        <div className="pt-4 border-t border-neutral-800">
          {isLoggedIn ? (
            <Link
              href={`/customer/apply?referenceId=${product.id}`}
              className="block w-full text-center px-4 py-3 bg-amber-600 text-white hover:bg-amber-700 transition-colors rounded font-medium"
              onClick={() => onOpenChange(false)}
            >
              以此風格發起合作
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="block w-full text-center px-4 py-3 bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors rounded"
              onClick={() => onOpenChange(false)}
            >
              登入後發起合作
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
