"use client";

import { Button } from "@/components/ui/button";
import { usePDFExport } from "@root/hooks/usePDFExport";
import { Download } from "lucide-react";


export default function ClientPDFButton() {
  const { exportToPDF } = usePDFExport();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportToPDF("專案詳細資料.pdf")}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      匯出整頁 PDF
    </Button>
  );
}