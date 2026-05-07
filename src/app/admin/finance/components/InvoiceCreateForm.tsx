//src/app/admin/finance/components/InvoiceCreateForm.tsx

"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "../types";

interface InvoiceCreateFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  accentColor?: string;
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "UNPAID", label: "未付款" },
  { value: "PARTIAL", label: "部分付款" },
  { value: "PAID", label: "已付款" },
  { value: "CANCELLED", label: "已取消" },
];

const inputClass = cn(
  "w-full px-3 py-2 bg-white dark:bg-zinc-800",
  "border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm",
  "text-zinc-900 dark:text-zinc-100",
  "placeholder:text-zinc-400",
  "focus:outline-none focus:ring-2 focus:border-transparent",
  "transition-shadow"
);

const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1";

export function InvoiceCreateForm({ open, onClose, onSuccess, accentColor = "#0078D4" }: InvoiceCreateFormProps) {
  const [form, setForm] = useState({
    projectCode: "",
    customerName: "",
    companyName: "",
    totalAmount: "",
    status: "UNPAID" as InvoiceStatus,
    issuedAt: new Date().toISOString().split("T")[0],
    dueDate: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 這裡呼叫 tRPC mutation
      // await api.adminInvoice.create.mutate({ ...form, totalAmount: Number(form.totalAmount) });
      console.log("提交表單", form);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("新增收據失敗", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* 標題列 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">新增收據</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 專案編號 */}
          <div>
            <label className={labelClass}>專案編號</label>
            <input
              type="text"
              placeholder="PRJ-2026-001"
              value={form.projectCode}
              onChange={(e) => setForm((p) => ({ ...p, projectCode: e.target.value }))}
              className={inputClass}
              required
            />
          </div>

          {/* 客戶名稱 + 公司抬頭 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>客戶名稱</label>
              <input
                type="text"
                placeholder="客戶名稱"
                value={form.customerName}
                onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>公司抬頭</label>
              <input
                type="text"
                placeholder="公司名稱"
                value={form.companyName}
                onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          {/* 金額 */}
          <div>
            <label className={labelClass}>金額 (NT$)</label>
            <input
              type="number"
              placeholder="0"
              min={0}
              value={form.totalAmount}
              onChange={(e) => setForm((p) => ({ ...p, totalAmount: e.target.value }))}
              className={inputClass}
              required
            />
          </div>

          {/* 狀態 */}
          <div>
            <label className={labelClass}>狀態</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as InvoiceStatus }))}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>開立日期</label>
              <input
                type="date"
                value={form.issuedAt}
                onChange={(e) => setForm((p) => ({ ...p, issuedAt: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>到期日期</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          {/* 備註 */}
          <div>
            <label className={labelClass}>備註</label>
            <textarea
              rows={3}
              placeholder="備註（選填）"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              className={cn(inputClass, "resize-none")}
            />
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-medium text-white transition",
                "hover:brightness-110 active:brightness-90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              style={{ backgroundColor: accentColor }}
            >
              {loading ? "新增中..." : "新增收據"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
