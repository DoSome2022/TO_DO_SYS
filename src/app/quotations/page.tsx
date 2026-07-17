// // app/sales/quotations/page.tsx
// import { Suspense } from 'react';
// import { redirect } from 'next/navigation';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { 
//   FileText, 
//   DollarSign,
//   CheckCircle,
//   Clock
// } from 'lucide-react';

// import { auth } from '@/auth';
// import { QuotationListClient } from '@/components/sales/quotations/QuotationListClient';
// import { api } from '../../../trpc/server';

// // 統計卡片 Skeleton
// function StatsSkeleton() {
//   return (
//     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//       {[1, 2, 3, 4].map((i) => (
//         <Card key={i}>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <Skeleton className="h-4 w-20" />
//             <Skeleton className="h-4 w-4" />
//           </CardHeader>
//           <CardContent>
//             <Skeleton className="h-8 w-24 mb-2" />
//             <Skeleton className="h-3 w-32" />
//           </CardContent>
//         </Card>
//       ))}
//     </div>
//   );
// }

// // 列表 Skeleton
// function QuotationListSkeleton() {
//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <Skeleton className="h-8 w-48" />
//           <Skeleton className="h-4 w-64 mt-2" />
//         </div>
//         <Skeleton className="h-10 w-32" />
//       </div>
//       <div className="space-y-4">
//         {[1, 2, 3].map((i) => (
//           <Skeleton key={i} className="h-32 w-full" />
//         ))}
//       </div>
//     </div>
//   );
// }

// // 統計資料 Server Component
// async function SalesStats() {
//   try {
//     // const stats = await api.quotation.getSalesStats();

//     const statCards = [
//       // {
//       //   title: '總報價單',
//       //   value: stats.quotationsCount,
//       //   icon: FileText,
//       //   description: '不含草稿',
//       //   color: 'text-blue-600',
//       //   bgColor: 'bg-blue-100 dark:bg-blue-900/30',
//       // },
//       // {
//       //   title: '贏單數量',
//       //   value: stats.wonQuotationsCount,
//       //   icon: CheckCircle,
//       //   description: `勝率 ${stats.winRate.toFixed(1)}%`,
//       //   color: 'text-green-600',
//       //   bgColor: 'bg-green-100 dark:bg-green-900/30',
//       // },
//       // {
//       //   title: '成交總額',
//       //   value: `$ ${stats.totalQuotationValue.toLocaleString()}`,
//       //   icon: DollarSign,
//       //   description: '已贏單總金額',
//       //   color: 'text-yellow-600',
//       //   bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
//       // },
//       // {
//       //   title: '進行中專案',
//       //   value: stats.activeProjectsCount,
//       //   icon: Clock,
//       //   description: `共 ${stats.projectsCount} 個專案`,
//       //   color: 'text-purple-600',
//       //   bgColor: 'bg-purple-100 dark:bg-purple-900/30',
//       // },
//     ];

//     return (
//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

//       </div>
//     );
//   } catch (error) {
//     console.error('Failed to fetch stats:', error);
//     return (
//       <div className="text-center py-8 text-muted-foreground">
//         無法載入統計資料
//       </div>
//     );
//   }
// }

// // 主要頁面 Component
// export default async function SalesQuotationsPage() {
//   // 檢查用戶是否有權限訪問此頁面
//   const session = await auth();
  
//   if (!session) {
//     redirect('/auth/signin');
//   }
  
//   // 檢查角色
//   const userRole = session.user?.role;
//   if (userRole !== 'SALES' && userRole !== 'ADMIN') {
//     redirect('/dashboard');
//   }
  
//   return (
//     <div className="min-h-screen bg-background">
//       <div className="container mx-auto py-8 px-4 max-w-7xl">
//         {/* 頁面標題 */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
//             報價單管理
//           </h1>

//         </div>
        
//         {/* 統計資料區塊 */}
//         <div className="mb-8">
//           <Suspense fallback={<StatsSkeleton />}>
//             <SalesStats />
//           </Suspense>
//         </div>
        
//         {/* 報價單列表 */}
//         <div className="mt-8">
//           <Suspense fallback={<QuotationListSkeleton />}>
//             <QuotationListClient />
//           </Suspense>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Metadata
// export const metadata = {
//   title: '報價單 | 銷售管理系統',
//   description: '管理您的所有報價單，追蹤銷售進度和成交狀況',
// };


// app/sales/quotations/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  DollarSign,
  CheckCircle,
  Clock
} from 'lucide-react';

import { auth } from '@/auth';
import { QuotationListClient } from '@/components/sales/quotations/QuotationListClient';
import { api } from '../../../trpc/server';

// 統計卡片 Skeleton
function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 列表 Skeleton
function QuotationListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}

// 統計資料 Server Component
async function SalesStats() {
  try {
    // const stats = await api.quotation.getSalesStats();

    const statCards = [
      // {
      //   title: '總報價單',
      //   value: stats.quotationsCount,
      //   icon: FileText,
      //   description: '不含草稿',
      //   color: 'text-blue-600',
      //   bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      // },
      // {
      //   title: '贏單數量',
      //   value: stats.wonQuotationsCount,
      //   icon: CheckCircle,
      //   description: `勝率 ${stats.winRate.toFixed(1)}%`,
      //   color: 'text-green-600',
      //   bgColor: 'bg-green-100 dark:bg-green-900/30',
      // },
      // {
      //   title: '成交總額',
      //   value: `$ ${stats.totalQuotationValue.toLocaleString()}`,
      //   icon: DollarSign,
      //   description: '已贏單總金額',
      //   color: 'text-yellow-600',
      //   bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      // },
      // {
      //   title: '進行中專案',
      //   value: stats.activeProjectsCount,
      //   icon: Clock,
      //   description: `共 ${stats.projectsCount} 個專案`,
      //   color: 'text-purple-600',
      //   bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      // },
    ];

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

      </div>
    );
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return (
      <div className="text-center py-8 text-muted-foreground">
        無法載入統計資料
      </div>
    );
  }
}

// 主要頁面 Component
export default async function SalesQuotationsPage() {
  // 檢查用戶是否有權限訪問此頁面
  const session = await auth();
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  // 檢查角色
  const userRole = session.user?.role;
  if (userRole !== 'SALES' && userRole !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            發票/報價單管理
          </h1>

        </div>
        
        {/* 統計資料區塊 */}
        <div className="mb-8">
          <Suspense fallback={<StatsSkeleton />}>
            <SalesStats />
          </Suspense>
        </div>
        
        {/* 報價單列表 */}
        <div className="mt-8">
          <Suspense fallback={<QuotationListSkeleton />}>
            <QuotationListClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Metadata
export const metadata = {
  title: '發票/報價單 | 銷售管理系統',
  description: '管理您的所有報價單，追蹤銷售進度和成交狀況',
};