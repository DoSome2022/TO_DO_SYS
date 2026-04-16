// src/components/Company/CompanyTable.tsx
"use client";

import { Button } from "@/components/ui/button";

interface CompanyTableProps {
  companies: any[]; // 實務上可改為 RouterOutputs['companyProfile']['getAll']
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export function CompanyTable({ companies, isLoading, onDelete }: CompanyTableProps) {
  if (isLoading) return <div>載入中...</div>;
  if (!companies?.length) return <div>目前沒有建立任何公司資料。</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3">公司名稱</th>
            <th className="p-3">統編</th>
            <th className="p-3">電話</th>
            <th className="p-3">地址</th>
            <th className="p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id} className="border-b hover:bg-muted/50">
              <td className="p-3 font-medium">
                <div className="flex items-center gap-2">
                  {company.logoUrl && (
                    <img src={company.logoUrl} alt="logo" className="w-6 h-6 object-contain" />
                  )}
                  {company.name}
                </div>
              </td>
              <td className="p-3 text-muted-foreground">{company.taxId || "-"}</td>
              <td className="p-3 text-muted-foreground">{company.phone || "-"}</td>
              <td className="p-3 text-muted-foreground">{company.address || "-"}</td>
              <td className="p-3">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (confirm(`確定要刪除「${company.name}」嗎？`)) onDelete(company.id);
                  }}
                >
                  刪除
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
