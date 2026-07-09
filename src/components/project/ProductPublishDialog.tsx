"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = [
  "MV 製作",
  "商業攝影",
  "活動紀錄",
  "形象影片",
  "廣告拍攝",
  "婚禮紀錄",
  "空拍攝影",
  "後製剪輯",
  "其他",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  onConfirm: (data: {
    projectId: string;
    isPublicPortfolio: boolean;
    productName?: string;
    productDescription?: string;
    productCategory?: string;
  }) => Promise<void>;
}

export function ProductPublishDialog({
  open,
  onOpenChange,
  project,
  onConfirm,
}: Props) {
  const [productName, setProductName] = useState(project?.productName || "");
  const [productDescription, setProductDescription] = useState(
    project?.productDescription || ""
  );
  const [productCategory, setProductCategory] = useState(
    project?.productCategory || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 切換專案時重置表單
  useEffect(() => {
    if (project) {
      setProductName(project.productName || project.title || "");
      setProductDescription(project.productDescription || "");
      setProductCategory(project.productCategory || "");
    }
  }, [project]);

  const handleSubmit = async () => {
    if (!productName.trim()) {
      toast.error("請填寫商品名稱");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        projectId: project.id,
        isPublicPortfolio: true,
        productName: productName.trim(),
        productDescription: productDescription.trim() || undefined,
        productCategory: productCategory || undefined,
      });
      toast.success("商品已上架");
      onOpenChange(false);
    } catch (error) {
      toast.error("上架失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>上架商品</DialogTitle>
          <DialogDescription>
            設定前台展示的商品資訊。商品名稱可以與專案名稱不同。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 來源專案 */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <span className="text-muted-foreground">來源專案：</span>
            <span className="font-medium">{project?.title}</span>
          </div>

          {/* 商品名稱 */}
          <div className="space-y-2">
            <Label>
              商品名稱 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="例如：質感婚禮精華MV"
            />
            <p className="text-xs text-muted-foreground">
              此名稱將顯示在首頁，不會影響後台的專案名稱
            </p>
          </div>

          {/* 商品分類 */}
          <div className="space-y-2">
            <Label>商品分類</Label>
            <Select value={productCategory} onValueChange={setProductCategory}>
              <SelectTrigger>
                <SelectValue placeholder="選擇分類（選填）" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              同分類的商品會在前台一起顯示
            </p>
          </div>

          {/* 商品描述 */}
          <div className="space-y-2">
            <Label>商品描述</Label>
            <Textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="描述這個商品/服務的詳細內容、包含項目..."
              className="h-32 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "上架中..." : "確認上架"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
