// // src/app/layout.tsx
// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";

// import TRPCProvider from "../../trpc/provider";
// import Navbar from "@/components/Navbar";
// import { SessionProvider } from "next-auth/react";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
//   weight: ["400", "500", "700"],
// });

// export const metadata: Metadata = {
//   title: "企業專案管理系統",
//   description: "基於自定義職位與權限的專案管理平台",
//   icons: {
//     icon: "/favicon.ico",
//   },
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="zh-TW">
//       <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
//       >
//         <SessionProvider>
//           {/* Navbar 會根據權限動態顯示選單 */}
//           <Navbar />

//           {/* TRPC Provider 包裝主要內容 */}
//           <TRPCProvider>
//             <main className="min-h-[calc(100vh-64px)]">
//               {children}
//             </main>
//           </TRPCProvider>
//         </SessionProvider>
//       </body>
//     </html>
//   );
// }


// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import TRPCProvider from "../../trpc/provider";
// 👇 改為引入我們剛寫的 Wrapper (大門)

import { SessionProvider } from "next-auth/react";
import NavbarWrapper from "@/components/Nabar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "企業專案管理系統",
  description: "基於自定義職位與權限的專案管理平台",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          
          {/* 👇 Navbar 會根據當前網址自動切換前台/後台版本，甚至在登入頁隱藏 */}
          <NavbarWrapper />

          {/* TRPC Provider 包裝主要內容 */}
          <TRPCProvider>
            <main className="min-h-[calc(100vh-64px)]">
              {children}
            </main>
          </TRPCProvider>
          
        </SessionProvider>
      </body>
    </html>
  );
}
