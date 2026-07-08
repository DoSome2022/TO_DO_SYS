// app/page.tsx (Server Component)

import Link from "next/link";
import { PortfolioCard } from "@/components/client/PortfolioCard"; 
import { db } from "./lib/prisma";
import { auth } from "@/auth";

// 1. 引入 NextAuth 的 session 獲取方法 
// (備註：如果您使用的是 NextAuth v5，請改成 import { auth } from "@/auth")


export default async function HomePage() {
  // 2. 在 Server 端取得目前的登入狀態
   const session = await auth(); // 直接呼叫 auth()

  const isLoggedIn = !!session;


  const publicProjects = await db.project.findMany({
    where: { isPublicPortfolio: true },
    include: { quotation: { where: { status: "WON" } } }, 
    take: 10,
  });

    const cardProjects = publicProjects.map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
  }));

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      {/* 英雄區塊 (Hero Section) */}
      <section className="relative h-screen flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-500">
          YOUR CINEMA VISION
        </h1>
        <p className="mt-4 text-neutral-400">創造觸動人心的視覺盛宴</p>
        
        {/* 3. 判斷是否有 session 來切換按鈕文字與樣式 */}
        {session ? (
          // <Link 
          //   href="/dashboard" // 假設登入後的使用者會去 dashboard (可依您專案路徑修改)
          //   className="mt-8 px-6 py-2 border border-amber-600 bg-amber-600/10 text-amber-500 hover:bg-amber-600 hover:text-white transition-colors rounded"
          // >
          //   進入您的專案控制台
          // </Link>
          <p></p>
        ) : (
          <Link 
            href="/auth/login" 
            className="mt-8 px-6 py-2 border border-neutral-700 hover:border-amber-500 hover:text-amber-500 transition-colors rounded"
          >
            客戶登入 / 註冊
          </Link>
        )}
      </section>

      {/* 作品展示區 */}
       <section className="container mx-auto py-20 grid grid-cols-1 md:grid-cols-2 gap-8">
        {cardProjects.map((project) => (
          <PortfolioCard 
            key={project.id} 
            project={project} 
            isLoggedIn={isLoggedIn} // 👈 2. 將登入狀態傳給子元件
          />
        ))}
      </section>
    </div>
  );
}
