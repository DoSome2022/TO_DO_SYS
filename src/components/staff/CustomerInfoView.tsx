// src/components/staff/CustomerInfoView.tsx
"use client";

import { Mail, Phone, Building2, User, MapPin } from "lucide-react";

type CustomerInfoViewProps = {
  customer: {
    name?: string | null;
    customname?: string | null;
    contactname?: string | null;
    contactphone?: string | null;
    companyname?: string | null;
    companyaddress?: string | null;
    companyemail?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  onEdit: () => void;
};

export default function CustomerInfoView({ customer, onEdit }: CustomerInfoViewProps) {
  return (
    <div className="p-6">
      {/* 頂部操作列 */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">客戶詳細資訊</h3>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                     hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          編輯資料
        </button>
      </div>

      {/* 聯絡人資訊 */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <User className="w-4 h-4" /> 聯絡人資訊
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard label="客戶名稱" value={customer.name} />
          <InfoCard label="顯示名稱" value={customer.customname} />
          <InfoCard label="聯絡人名稱" value={customer.contactname} icon={<User className="w-4 h-4 text-gray-400" />} />
          <InfoCard label="聯絡人電話" value={customer.contactphone} icon={<Phone className="w-4 h-4 text-gray-400" />} />
          <InfoCard label="電子郵件" value={customer.email} icon={<Mail className="w-4 h-4 text-gray-400" />} />
          <InfoCard label="聯絡電話" value={customer.phone} icon={<Phone className="w-4 h-4 text-gray-400" />} />
        </div>
      </div>

      {/* 公司資訊 */}
      {(customer.companyname || customer.companyaddress || customer.companyemail) && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> 公司資訊
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard label="公司名稱" value={customer.companyname} icon={<Building2 className="w-4 h-4 text-gray-400" />} />
            <InfoCard label="公司信箱" value={customer.companyemail} icon={<Mail className="w-4 h-4 text-gray-400" />} />
            {customer.companyaddress && (
              <div className="md:col-span-2">
                <InfoCard label="公司地址" value={customer.companyaddress} icon={<MapPin className="w-4 h-4 text-gray-400" />} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 輔助元件：單一資訊卡片
function InfoCard({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value?: string | null; 
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <p className="text-gray-900 font-medium">{value || <span className="text-gray-300 italic">未設定</span>}</p>
    </div>
  );
}
