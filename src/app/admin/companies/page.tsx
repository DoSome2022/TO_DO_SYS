// src/app/admin/companies/page.tsx
"use client";


import { CompanyForm } from "@/components/Company/CompanyForm";
import { CompanyTable } from "@/components/Company/CompanyTable";
import { useCompanyProfiles } from "../../../../hooks/use-company-profiles";

export default function AdminCompaniesPage() {
  const { 
    companies, 
    isLoading, 
    createCompany, 
    isCreating, 
    deleteCompany 
  } = useCompanyProfiles();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">發行公司/品牌管理</h1>
        <p className="text-muted-foreground mb-6">在這裡管理您用來發送報價單的公司抬頭與 Logo。</p>
        
        {/* 表單區塊 */}
        <div className="p-6 border rounded-xl bg-card">
          <h2 className="text-lg font-semibold mb-4">新增公司資料</h2>
          <CompanyForm 
            // 👇 完美解決 Promise<void> 問題的寫法
            onSubmit={async (data) => {
              await createCompany(data);
            }} 
            isLoading={isCreating} 
          />
        </div>
      </div>

      {/* 列表區塊 */}
      <div className="border rounded-xl p-0 overflow-hidden bg-card">
        <CompanyTable 
          companies={companies ?? []} 
          isLoading={isLoading} 
          onDelete={async (id) => {
            await deleteCompany({ id });
          }}
        />
      </div>
    </div>
  );
}
