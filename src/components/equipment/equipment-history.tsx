// src/components/equipment/equipment-history.tsx

"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { 
  Calendar, 
  Wrench, 
  User, 
  History, 
  AlertCircle, 
  CheckCircle2,
  MapPin,
  FileText
} from "lucide-react";

// 定義我們需要的資料結構 (根據你的 Prisma Schema)
type HistoryEvent = {
  id: string;
  type: "CREATED" | "LOAN" | "MAINTENANCE" | "LOG";
  date: Date;
  title: string;
  description?: React.ReactNode;
  user?: string; // 執行者或相關人員
  icon: React.ReactNode;
  color: string;
};

// 這裡定義 Props，假設傳入的是包含了關聯資料的 equipment
interface EquipmentHistoryProps {
  equipment: {
    createdAt: Date;
    createdBy?: string;
    loans: any[];         // 替換成你的 Loan 類型
    maintenances: any[];  // 替換成你的 Maintenance 類型
    logs: any[];          // 替換成你的 AuditLog 類型
  };
}

export const EquipmentHistory = ({ equipment }: EquipmentHistoryProps) => {
  
  // 🔄 核心邏輯：將所有經歷合併並按時間排序
  const timelineEvents = useMemo(() => {
    const events: HistoryEvent[] = [];

    // 1. 出生 (建檔)
    events.push({
      id: "creation",
      type: "CREATED",
      date: new Date(equipment.createdAt),
      title: "設備建檔入庫",
      description: "設備資料首次建立",
      user: equipment.createdBy || "系統",
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "bg-green-100 text-green-600 border-green-200",
    });

    // 2. 工作經歷 (借用紀錄)
    equipment.loans?.forEach((loan) => {
      // 借出事件
      events.push({
        id: `loan-out-${loan.id}`,
        type: "LOAN",
        date: new Date(loan.startDate),
        title: "設備借出",
        description: (
          <span className="text-sm">
            預計歸還：{format(new Date(loan.endDate), "yyyy/MM/dd")}
          </span>
        ),
        user: loan.userId, // 這裡應該是關聯 User 的名字
        icon: <User className="w-4 h-4" />,
        color: "bg-blue-100 text-blue-600 border-blue-200",
      });

      // 如果已歸還，加入歸還事件
      if (loan.actualReturnDate) {
        events.push({
          id: `loan-in-${loan.id}`,
          type: "LOAN",
          date: new Date(loan.actualReturnDate),
          title: "設備歸還",
          description: "設備已確認歸還入庫",
          user: loan.userId,
          icon: <MapPin className="w-4 h-4" />,
          color: "bg-blue-50 text-blue-400 border-blue-100",
        });
      }
    });

    // 3. 病歷 (維修紀錄)
    equipment.maintenances?.forEach((maint) => {
      events.push({
        id: `maint-${maint.id}`,
        type: "MAINTENANCE",
        date: new Date(maint.startDate),
        title: `維修保養: ${maint.type}`,
        description: (
          <div className="flex flex-col gap-1">
            <span>{maint.description}</span>
            <span className="font-bold text-xs">費用: ${maint.cost}</span>
            <span className={`text-xs px-2 py-0.5 rounded w-fit ${maint.status === 'COMPLETED' ? 'bg-green-200' : 'bg-yellow-200'}`}>
              {maint.status}
            </span>
          </div>
        ),
        user: maint.technician || "外部廠商",
        icon: <Wrench className="w-4 h-4" />,
        color: "bg-orange-100 text-orange-600 border-orange-200",
      });
    });

    // 4. 戶籍變更 (操作日誌)
    equipment.logs?.forEach((log) => {
      // 過濾掉一些不重要的 log，只顯示關鍵變更
      events.push({
        id: `log-${log.id}`,
        type: "LOG",
        date: new Date(log.createdAt),
        title: `資料變更: ${log.action}`,
        description: `變更欄位: ${log.details}`, // 假設 details 存了變更內容
        user: log.userId,
        icon: <FileText className="w-4 h-4" />,
        color: "bg-gray-100 text-gray-500 border-gray-200",
      });
    });

    // 排序：最新的在上面
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [equipment]);

  if (timelineEvents.length === 0) {
    return <div className="text-gray-500 text-center py-8">尚無任何歷史紀錄</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <History className="w-5 h-5 text-gray-700" />
        設備生命歷程
      </h3>

      <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
        {timelineEvents.map((event, index) => (
          <div key={event.id} className="relative pl-8 animate-in slide-in-from-bottom-2 fade-in duration-500" style={{ animationDelay: `${index * 50}ms` }}>
            {/* 時間軸上的圓點圖標 */}
            <div className={`absolute -left-[9px] top-0 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${event.color.replace('bg-', 'border-').split(' ')[2]}`}>
              <div className={`w-2 h-2 rounded-full ${event.color.split(' ')[1].replace('text-', 'bg-')}`} />
            </div>

            {/* 卡片內容 */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`p-1 rounded-md ${event.color}`}>
                    {event.icon}
                  </span>
                  <span className="font-bold text-gray-900">{event.title}</span>
                </div>
                
                <div className="text-sm text-gray-600 mt-1 pl-1">
                  {event.description}
                </div>
                
                {event.user && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 pl-1">
                    <User className="w-3 h-3" />
                    <span>操作人員: {event.user}</span>
                  </div>
                )}
              </div>

              {/* 日期時間 */}
              <div className="text-xs font-mono text-gray-400 whitespace-nowrap pt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(event.date, "yyyy/MM/dd", { locale: zhTW })}
                </div>
                <div className="text-right mt-0.5">
                  {format(event.date, "HH:mm", { locale: zhTW })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
