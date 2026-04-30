// lib/dashboard/query-engine.ts
import type { PrismaClient } from "@prisma/client";
import type { MetricDefinition } from "@/types/dashboard-metrics";

export async function executeMetricQuery(
  db: PrismaClient,
  metric: MetricDefinition,
  input: { filters?: any; dateRange?: { start: string; end: string } }
) {
  switch (metric.key) {
    // ===== 用戶指標 =====
    case "total_users":
      return { value: await db.user.count() };
      
    case "active_users":
      return { value: await db.user.count({ where: { isActive: true } }) };
      
case "users_by_position": {
  const users = await db.user.findMany({
    where: { positionId: { not: null } },
    // ★ 只保留 select，移除 include
    select: { 
      positionId: true, 
      position: { 
        select: { name: true } 
      } 
    },
  });
  // 統計各職位人數
  const grouped: Record<string, number> = {};
  users.forEach(u => {
    const name = u.position?.name || "未指派";
    grouped[name] = (grouped[name] || 0) + 1;
  });
  return {
    chartData: Object.entries(grouped).map(([name, count]) => ({
      label: name,
      value: count,
    })),
  };
}
    
    case "users_by_role": {
      const users = await db.user.groupBy({
        by: ["role"],
        _count: { id: true },
      });
      return {
        chartData: users.map(u => ({
          label: u.role,
          value: u._count.id,
        })),
      };
    }

    // ===== 專案指標 =====
    case "active_projects":
      return { value: await db.project.count({ where: { status: "IN_PROGRESS" } }) };
      
    case "projects_by_status": {
      const projects = await db.project.groupBy({
        by: ["status"],
        _count: { id: true },
      });
      return {
        chartData: projects.map(p => ({
          label: p.status,
          value: p._count.id,
        })),
      };
    }
      
    case "overdue_projects":
      return {
        value: await db.project.count({
          where: {
            status: "IN_PROGRESS",
            endDate: { lt: new Date() },
          },
        }),
      };
      
    case "projects_by_pm": {
      const projects = await db.project.findMany({
        where: { pmId: { not: null } },
        include: { pm: { select: { name: true } } },
      });
      const grouped: Record<string, number> = {};
      projects.forEach(p => {
        const name = p.pm?.name || "未指派";
        grouped[name] = (grouped[name] || 0) + 1;
      });
      return {
        chartData: Object.entries(grouped).map(([name, count]) => ({
          label: name,
          value: count,
        })),
      };
    }
      
    case "pending_versions":
      return {
        value: await db.workVersion.count({
          where: { reviewStatus: "PENDING" },
        }),
      };

    // ===== 銷售指標 =====
    case "total_quotations":
      return { value: await db.quotation.count() };
      
    case "win_rate": {
      const total = await db.quotation.count();
      const won = await db.quotation.count({ where: { status: "WON" } });
      return {
        value: total > 0 ? Math.round((won / total) * 100) : 0,
        display: `${Math.round((won / total) * 100)}%`,
        details: { won, total },
      };
    }
      
    case "total_quotation_amount": {
      const result = await db.quotation.aggregate({
        _sum: { totalAmount: true },
      });
      return { value: result._sum.totalAmount || 0 };
    }
      
case "quotations_by_sales": {
  // ★ 修正1：移除 where 條件（salesId 是必填欄位，不可能為 null）
  // ★ 修正2：改用 select 取代 include 以避開類型推斷問題
  const quotations = await db.quotation.findMany({
    select: {
      salesId: true,
      totalAmount: true,
      sales: {
        select: { name: true },
      },
    },
  });
  
  const grouped: Record<string, { count: number; total: number }> = {};
  quotations.forEach(q => {
    const name = q.sales?.name || "未指派";
    if (!grouped[name]) grouped[name] = { count: 0, total: 0 };
    grouped[name].count++;
    grouped[name].total += Number(q.totalAmount);
  });
  
  return {
    chartData: Object.entries(grouped)
      .map(([label, data]) => ({ label, value: data.count, amount: data.total }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
  };
}


    // ===== 設備指標 =====
    case "available_equipment":
      return { value: await db.equipment.count({ where: { status: "AVAILABLE" } }) };
      
    case "equipment_by_status": {
      const equipments = await db.equipment.groupBy({
        by: ["status"],
        _count: { id: true },
      });
      return {
        chartData: equipments.map(e => ({
          label: e.status,
          value: e._count.id,
        })),
      };
    }
      
    case "equipment_asset_value": {
      const result = await db.equipment.aggregate({
        _sum: { value: true },
      });
      return { value: result._sum.value || 0 };
    }
      
    case "maintenance_cost": {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const result = await db.maintenanceRecord.aggregate({
        _sum: { cost: true },
        where: { startDate: { gte: startOfMonth } },
      });
      return { value: result._sum.cost || 0 };
    }
      
    case "overdue_equipment_logs": {
      const logs = await db.equipmentLog.findMany({
        where: {
          returnedAt: null,
          dueAt: { lt: new Date() },
        },
        include: {
          equipment: { select: { name: true } },
          borrowedBy: { select: { name: true } },
        },
        take: 10,
        orderBy: { dueAt: 'asc' },
      });
      return {
        list: logs.map(l => ({
          equipmentName: l.equipment.name,
          borrowerName: l.borrowedBy?.name || "未知",
          dueAt: l.dueAt,
          daysOverdue: Math.floor((Date.now() - (l.dueAt?.getTime() || 0)) / 86400000),
        })),
      };
    }

    // ===== 任務指標 =====
    case "staff_todo_completion_rate": {
      const total = await db.staff_TODO.count();
      const completed = await db.staff_TODO.count({ where: { completed: true } });
      return {
        value: total > 0 ? Math.round((completed / total) * 100) : 0,
        display: `${Math.round((completed / total) * 100)}%`,
        details: { completed, total },
      };
    }
      
    case "overdue_todos": {
      const todos = await db.staff_TODO.findMany({
        where: {
          completed: false,
          targetDate: { lt: new Date() },
        },
        include: { staff: { select: { name: true } } },
        take: 20,
      });
      return {
        value: todos.length,
        list: todos.map(t => ({
          title: t.Title,
          staffName: t.staff?.name || "未知",
          targetDate: t.targetDate,
        })),
      };
    }

    // ===== 客戶指標 =====
    case "total_customers":
      return { value: await db.customer.count() };
      
    case "pending_collaboration_requests":
      return { value: await db.collaborationRequest.count({ where: { status: "PENDING" } }) };

    default:
      throw new Error(`Unknown metric: ${metric.key}`);
  }
}
