// // app/dashboard/page.tsx
// import { auth } from "@/auth"; // ⚠️ 替換成你實際 auth.ts 的路徑
// import WorkItemsViewer from "@/components/WorkItemsViewer";
// import { redirect } from "next/navigation";

// export default async function DashboardPage() {
//   // 🔥 1. 在 Server Component 使用 auth() 取得 session
//   const session = await auth(); 
  
//   // 🔥 2. 如果沒登入，可以踢回登入頁 (或交給 middleware 處理)
//   if (!session?.user) {
//     redirect("/api/auth/signin");
//   }

//   // 取得目前登入者的 ID
//   const myUserId = session.user.id; 

//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">早安，{session.user.name || "使用者"}</h1>
//       <h2 className="text-xl mb-2">我的今日工作</h2>
      
//       {/* 員工模式：傳入真實的使用者 ID */}
//       <WorkItemsViewer 
//         initialStaffId={myUserId} 
//         isPmMode={false} 
//       />
//     </div>
//   );
// }


// app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DynamicDashboardClient from "@/components/dashboard/DynamicDashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return <DynamicDashboardClient />;
}