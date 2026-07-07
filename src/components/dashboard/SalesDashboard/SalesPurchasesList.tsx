// src/components/dashboard/SalesDashboard/SalesPurchasesList.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, MoreHorizontal, Pencil, Trash2, Search, Plus } from "lucide-react";
import { format } from "date-fns";
import { zhHK } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
// import {
//   useDeletePurchase,
// } from "@/hooks/usePurchase";
import CreatePurchaseDialog from "./CreatePurchaseDialog";
import { useDeletePurchase } from "../../../../hooks/usePurchase";

// ---------- Props 型別 ----------
interface Props {
  initialPurchases: any[];
  initialTotal: number;
}

// ---------- 狀態設定 ----------
const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "草稿",    color: "bg-gray-100 text-gray-700" },
  PENDING:   { label: "待審核",  color: "bg-yellow-100 text-yellow-700" },
  APPROVED:  { label: "已核准",  color: "bg-blue-100 text-blue-700" },
  ORDERED:   { label: "已下單",  color: "bg-indigo-100 text-indigo-700" },
  PARTIAL:   { label: "部分到貨", color: "bg-orange-100 text-orange-700" },
  COMPLETED: { label: "已完成",  color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "已取消",  color: "bg-red-100 text-red-700" },
};

function formatMoney(amount: number | string) {
  return new Intl.NumberFormat("zh-HK", {
    style: "currency",
    currency: "HKD",
  }).format(Number(amount));
}

// ==========================================
// Client Component
// ==========================================
export default function SalesPurchasesList({ initialPurchases, initialTotal }: Props) {
  // ── 狀態 ──
  const [search, setSearch] = useState("");
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [viewingPurchase, setViewingPurchase] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false); // ← 🆕 新增對話框狀態

  const deletePurchase = useDeletePurchase();

  // 簡單過濾（後續可換成搜尋 API）
  const filtered = initialPurchases.filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.purchaseNo?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.supplier?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此採購單嗎？")) return;
    try {
      await deletePurchase.mutateAsync({ id });
      toast.success("採購單已刪除");
    } catch {
      toast.error("刪除失敗");
    }
  };

  return (
    <>
      {/* ── 上方：搜尋 + 新增按鈕 ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋採購單號或標題..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 🆕 新增採購按鈕 */}
        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          新增採購
        </Button>
      </div>

      {/* ── 表格 ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search ? "無符合條件的採購記錄" : "暫無採購記錄"}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">採購單號</TableHead>
                <TableHead>標題</TableHead>
                <TableHead>供應商</TableHead>
                <TableHead className="text-right">總金額</TableHead>
                {/* <TableHead className="w-[100px]">狀態</TableHead> */}
                <TableHead className="w-[120px]">下單日期</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((purchase: any) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-mono text-xs">
                    {purchase.purchaseNo}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {purchase.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {purchase.supplier || "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(purchase.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={statusConfig[purchase.status]?.color ?? "bg-gray-100"}
                      variant="outline"
                    >
                      {statusConfig[purchase.status]?.label ?? purchase.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(purchase.orderDate), "yyyy/MM/dd", { locale: zhHK })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingPurchase(purchase)}>
                          <Eye className="w-4 h-4 mr-2" />
                          詳情
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingPurchase(purchase)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          編輯
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(purchase.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          刪除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 分頁資訊 */}
      <div className="text-sm text-muted-foreground text-right mt-2">
        共 {initialTotal} 筆記錄
      </div>

      {/* ── 🆕 新增採購對話框 ── */}
      <CreatePurchaseDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* 編輯對話框 */}
      {editingPurchase && (
        <CreatePurchaseDialog
          open={!!editingPurchase}
          onOpenChange={(open) => { if (!open) setEditingPurchase(null); }}
          purchase={editingPurchase}
        />
      )}

      {/* 檢視詳情對話框 */}
      <Dialog open={!!viewingPurchase} onOpenChange={(open) => { if (!open) setViewingPurchase(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>採購詳情 — {viewingPurchase?.purchaseNo}</DialogTitle>
          </DialogHeader>
          {viewingPurchase && <PurchaseDetailView purchase={viewingPurchase} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==========================================
// 採購詳情
// ==========================================
function PurchaseDetailView({ purchase }: { purchase: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">標題：</span>
          {purchase.title}
        </div>
        <div>
          <span className="text-muted-foreground">供應商：</span>
          {purchase.supplier || "—"}
        </div>
        <div>
          {/* <span className="text-muted-foreground">狀態：</span>
          <Badge className={statusConfig[purchase.status]?.color} variant="outline">
            {statusConfig[purchase.status]?.label}
          </Badge> */}
        </div>
        <div>
          <span className="text-muted-foreground">總金額：</span>
          <span className="font-mono">{formatMoney(purchase.totalAmount)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">下單日期：</span>
          {format(new Date(purchase.orderDate), "yyyy/MM/dd")}
        </div>
        {purchase.expectedDate && (
          <div>
            <span className="text-muted-foreground">預計到貨：</span>
            {format(new Date(purchase.expectedDate), "yyyy/MM/dd")}
          </div>
        )}
        {purchase.receivedDate && (
          <div>
            <span className="text-muted-foreground">實際到貨：</span>
            {format(new Date(purchase.receivedDate), "yyyy/MM/dd")}
          </div>
        )}
      </div>

      {purchase.notes && (
        <div>
          <h4 className="text-sm font-medium mb-1">備註</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{purchase.notes}</p>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium mb-2">採購明細</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>品名</TableHead>
              <TableHead>品牌/型號</TableHead>
              <TableHead className="text-right">數量</TableHead>
              <TableHead className="text-right">單價</TableHead>
              <TableHead className="text-right">小計</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchase.items?.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>{item.itemName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {[item.brand, item.model].filter(Boolean).join(" / ") || "—"}
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(item.unitPrice)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(item.subtotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground">
        建立者：{purchase.createdBy?.name ?? "—"} 
        {" · "}
        建立時間：{format(new Date(purchase.createdAt), "yyyy/MM/dd HH:mm")}
      </div>
    </div>
  );
}
