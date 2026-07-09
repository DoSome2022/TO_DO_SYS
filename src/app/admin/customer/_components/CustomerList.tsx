// src/app/admin/customer/_components/CustomerList.tsx
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Loader2, Search, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "../../../../../trpc/client";

export default function CustomerList() {
  // ── 搜尋狀態 ──
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 查詢（帶搜尋關鍵字） ──
  const { data: customers, isLoading, refetch } = trpc.customer.getAllCustomer.useQuery(
    { search: search || undefined },
    { enabled: true }
  );

  // ── 匯出 CSV ──
  const handleExport = () => {
    if (!customers || customers.length === 0) {
      toast.error("沒有客戶資料可匯出");
      return;
    }

    // CSV 表頭
    const headers = [
      "名稱",
      "公司名稱",
      "Email",
      "電話",
      "聯絡人",
      "聯絡人電話",
      "公司地址",
      "公司Email",
    ];

    // CSV 內容
    const rows = customers.map((c) => [
      c.name || "",
      c.companyname || "",
      c.email || "",
      c.phone || "",
      c.contactname || "",
      c.contactphone || "",
      c.companyaddress || "",
      c.companyemail || "",
    ]);

    // 組合 CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // 下載
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // UTF-8 BOM 讓 Excel 正確顯示中文
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `客戶資料_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`已匯出 ${customers.length} 筆客戶資料`);
  };

  // ── 匯入 CSV ──
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();

      // 解析 CSV（簡單版本）
      const lines = text.split("\n").filter(Boolean);
      if (lines.length < 2) {
        toast.error("CSV 檔案格式錯誤（缺少資料列）");
        return;
      }

      // 跳過表頭，從第2行開始
      const results: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]
          .replace(/^"|"$/g, "")
          .split(/","/)
          .map((v) => v.replace(/^"|"$/g, "").trim());

        if (values.length >= 1 && values[0]) {
          results.push({
            name: values[0] || undefined,
            companyname: values[1] || undefined,
            email: values[2] || undefined,
            phone: values[3] || undefined,
            contactname: values[4] || undefined,
            contactphone: values[5] || undefined,
            companyaddress: values[6] || undefined,
            companyemail: values[7] || undefined,
            password: "default123", // 匯入時設預設密碼
          });
        }
      }

      if (results.length === 0) {
        toast.error("CSV 中沒有有效的客戶資料");
        return;
      }

      // 批次建立客戶（用 Promise.all）
      let successCount = 0;
      for (const data of results) {
        try {
          await fetch("/api/trpc/customer.createCustomer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 0: { json: data } }),
          });
          successCount++;
        } catch {
          // 跳過失敗的
        }
      }

      toast.success(`成功匯入 ${successCount}/${results.length} 筆客戶`);
      refetch();
    } catch (error) {
      toast.error("匯入失敗，請檢查 CSV 格式");
    }

    // 重置 file input，讓用戶可以再次上傳同一個檔案
    e.target.value = "";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── 工具列：搜尋 + 匯入/匯出 ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜尋客戶名稱、公司、Email、電話、地址..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          匯出 CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleImportClick} className="gap-2">
          <Upload className="w-4 h-4" />
          匯入 CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── 客戶列表表格 ── */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4 font-medium">名稱</th>
              <th className="p-4 font-medium">公司</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">電話</th>
              <th className="p-4 font-medium">地址</th>
              <th className="p-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers?.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="p-4">{customer.name || "-"}</td>
                <td className="p-4">{customer.companyname || "-"}</td>
                <td className="p-4">{customer.email}</td>
                <td className="p-4">{customer.phone || "-"}</td>
                <td className="p-4 max-w-[200px] truncate" title={customer.companyaddress || ""}>
                  {customer.companyaddress || "-"}
                </td>
                <td className="p-4">
                  <Link
                    href={`/admin/customer/${customer.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit / View
                  </Link>
                </td>
              </tr>
            ))}
            {customers?.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  {search ? "無符合條件的客戶" : "尚未建立任何客戶"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 筆數統計 */}
      <div className="text-sm text-gray-500 text-right">
        共 {customers?.length || 0} 筆客戶資料
      </div>
    </div>
  );
}
