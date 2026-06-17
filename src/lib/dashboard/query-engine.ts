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
      
    // ===== 🆕 員工工作進度指標 =====
case "staff_workload_table": {
  const activeStaff = await db.user.findMany({
    where: {
      isActive: true,
      role: { notIn: ["ADMIN", "SUPER_ADMIN"] },
    },
    select: {
      id: true,
      name: true,
      position: { select: { name: true } },
    },
  });

  const tableData = await Promise.all(
    activeStaff.map(async (staff) => {
      const totalWorkItems = await db.workItem.count({
        where: { staffId: staff.id },
      });
      const completedWorkItems = await db.workItem.count({
        where: { staffId: staff.id, isCompleted: true },
      });
      const overdueWorkItems = await db.workItem.count({
        where: {
          staffId: staff.id,
          isCompleted: false,
          deadline: { lt: new Date(), not: null },
        },
      });
      const totalTodos = await db.staff_TODO.count({
        where: { staff_id: staff.id },
      });
      const completedTodos = await db.staff_TODO.count({
        where: { staff_id: staff.id, completed: true },
      });

      return {
        員工姓名: staff.name,
        職位: staff.position?.name || "未設定",
        WorkItem總數: totalWorkItems,
        已完成工作: completedWorkItems,
        未完成工作: totalWorkItems - completedWorkItems,
        逾期工作: overdueWorkItems,
        待辦總數: totalTodos,
        待辦完成率: totalTodos > 0
          ? `${Math.round((completedTodos / totalTodos) * 100)}%`
          : "0%",
      };
    })
  );

  tableData.sort((a, b) => b.未完成工作 - a.未完成工作);

  // 🔥 回傳 columns + rows
  return {
    columns: [
      { key: "員工姓名", label: "員工姓名" },
      { key: "職位", label: "職位" },
      { key: "WorkItem總數", label: "WorkItem總數" },
      { key: "已完成工作", label: "已完成工作" },
      { key: "未完成工作", label: "未完成工作" },
      { key: "逾期工作", label: "逾期工作" },
      { key: "待辦總數", label: "待辦總數" },
      { key: "待辦完成率", label: "待辦完成率" },
    ],
    rows: tableData,
  };
}


    case "staff_overdue_summary": {
      // 找出所有逾期的 WorkItem
      const overdueWorkItems = await db.workItem.findMany({
        where: {
          isCompleted: false,
          deadline: { lt: new Date(), not: null },
        },
        select: {
          title: true,
          deadline: true,
          staff: { select: { name: true } },
          project: { select: { title: true } },
        },
        orderBy: { deadline: "asc" },
        take: input?.filters?.limit ?? 15,
      });

      // 找出所有逾期的 Staff_TODO
      const overdueTodos = await db.staff_TODO.findMany({
        where: {
          completed: false,
          targetDate: { lt: new Date(), not: null },
        },
        select: {
          Title: true,
          targetDate: true,
          staff: { select: { name: true } },
        },
        orderBy: { targetDate: "asc" },
        take: input?.filters?.limit ?? 15,
      });

      // 合併轉換為 ListWidget 要求的格式
      const list: Array<{ label: string; value: string | number }> = [];

      overdueWorkItems.forEach((item) => {
        const daysOverdue = Math.floor(
          (Date.now() - (item.deadline?.getTime() || 0)) / 86400000
        );
        list.push({
          label: `📋 ${item.title}（${item.staff?.name || "未知"}）`,
          value: `逾期 ${daysOverdue} 天`,
        });
      });

      overdueTodos.forEach((todo) => {
        const daysOverdue = Math.floor(
          (Date.now() - (todo.targetDate?.getTime() || 0)) / 86400000
        );
        list.push({
          label: `✅ ${todo.Title || "未命名待辦"}（${todo.staff?.name || "未知"}）`,
          value: `逾期 ${daysOverdue} 天`,
        });
      });

      return list; // ← 直接回傳陣列，ListWidget 的 data 就是 ListItem[]
    }

    case "staff_todo_by_employee": {
      const staffWithTodos = await db.user.findMany({
        where: {
          isActive: true,
          role: { notIn: ["ADMIN", "SUPER_ADMIN"] },
          staffTodos: { some: {} }, // 至少有 TODO
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              staffTodos: true,
            },
          },
        },
      });

      const chartData = await Promise.all(
        staffWithTodos.map(async (staff) => {
          const completed = await db.staff_TODO.count({
            where: { staff_id: staff.id, completed: true },
          });
          const total = staff._count.staffTodos;
          return {
            label: staff.name,
            value: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        })
      );

      chartData.sort((a, b) => b.value - a.value);

      return { chartData };
    }

    // ===== 🆕 專案工作進度指標 =====
case "project_progress_table": {
  const projects = await db.project.findMany({
    where: { status: { not: "COMPLETED" } },
    select: {
      id: true,
      title: true,
      status: true,
      endDate: true,
      pm: { select: { name: true } },
      _count: {
        select: {
          phases: true,
          workItems: true,
        },
      },
    },
    orderBy: { endDate: "asc" },
  });

  const tableData = await Promise.all(
    projects.map(async (project) => {
      const completedPhases = await db.projectPhase.count({
        where: { projectId: project.id, status: "COMPLETED" },
      });
      const completedWorkItems = await db.workItem.count({
        where: { projectId: project.id, isCompleted: true },
      });

      const totalPhases = project._count.phases;
      const totalWorkItems = project._count.workItems;
      const daysRemaining = project.endDate
        ? Math.ceil((project.endDate.getTime() - Date.now()) / 86400000)
        : null;

      return {
        專案名稱: project.title,
        PM: project.pm?.name || "未指派",
        狀態: project.status === "IN_PROGRESS" ? "進行中" : project.status,
        階段完成: `${completedPhases}/${totalPhases}`,
        階段完成率: totalPhases > 0
          ? `${Math.round((completedPhases / totalPhases) * 100)}%`
          : "無階段",
        工作項完成: `${completedWorkItems}/${totalWorkItems}`,
        工作完成率: totalWorkItems > 0
          ? `${Math.round((completedWorkItems / totalWorkItems) * 100)}%`
          : "無工作項",
        剩餘天數: daysRemaining !== null
          ? daysRemaining >= 0 ? `${daysRemaining} 天` : `已逾期 ${Math.abs(daysRemaining)} 天`
          : "未設定",
      };
    })
  );

  // 🔥 回傳 columns + rows
  return {
    columns: [
      { key: "專案名稱", label: "專案名稱" },
      { key: "PM", label: "PM" },
      { key: "狀態", label: "狀態" },
      { key: "階段完成", label: "階段完成" },
      { key: "階段完成率", label: "階段完成率" },
      { key: "工作項完成", label: "工作項完成" },
      { key: "工作完成率", label: "工作完成率" },
      { key: "剩餘天數", label: "剩餘天數" },
    ],
    rows: tableData,
  };
}


    case "project_phase_status_pie": {
      const phases = await db.projectPhase.groupBy({
        by: ["status"],
        _count: { id: true },
      });

      const statusLabel: Record<string, string> = {
        PENDING: "待開始",
        IN_PROGRESS: "進行中",
        COMPLETED: "已完成",
      };

      return {
        chartData: phases.map((p) => ({
          label: statusLabel[p.status] || p.status,
          value: p._count.id,
        })),
      };
    }

    case "project_upcoming_deadlines": {
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const projects = await db.project.findMany({
        where: {
          status: "IN_PROGRESS",
          endDate: {
            gte: now,
            lte: sevenDaysLater,
          },
        },
        select: {
          id: true,
          title: true,
          endDate: true,
          pm: { select: { name: true } },
          _count: {
            select: { workItems: true },
          },
        },
        orderBy: { endDate: "asc" },
        take: input?.filters?.limit ?? 10,
      });

      const listData = await Promise.all(
        projects.map(async (project) => {
          const completedWorkItems = await db.workItem.count({
            where: { projectId: project.id, isCompleted: true },
          });
          const totalWorkItems = project._count.workItems;
          const daysLeft = project.endDate
            ? Math.ceil(
                (project.endDate.getTime() - Date.now()) / 86400000
              )
            : 0;
          const completionRate =
            totalWorkItems > 0
              ? Math.round((completedWorkItems / totalWorkItems) * 100)
              : 0;

          return {
            label: `${project.title}（${project.pm?.name || "無 PM"}）`,
            value: `剩 ${daysLeft} 天・完成 ${completionRate}%`,
          };
        })
      );

      return listData; // ← 直接回傳 ListItem[] 陣列
    }


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
