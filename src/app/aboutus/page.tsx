import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

// 與 layout.tsx 完全一致字型配置
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

// 頁面專屬 Meta
export const metadata: Metadata = {
  title: "關於我們 | 企業專案管理系統",
  description: "聯絡資訊、公司地址地圖與企業介紹",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function AboutPage() {
  // 公司聯絡資料
  const contact = {
    email: "vincenttong@lovelyplus.hk",
    phone: "(852) 6652 2352",
  };

  return (
    <div className="bg-black">
        <div className={`${geistSans.variable} ${geistMono.variable} antialiased px-6 py-10 max-w-6xl mx-auto bg-black text-amber-400 min-h-dvh`}>
            <h1 className="text-3xl font-bold mb-8 text-yellow-300">CONTACT US</h1>

            {/* 聯絡資訊區塊 */}
            <section className="mb-10 space-y-4">
                {/* <h2 className="text-xl font-semibold border-b border-white pb-2 text-yellow-200">聯絡資料</h2> */}
                <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <p className="text-white">Email</p>
                    <a
                    href={`mailto:${contact.email}`}
                    className="text-amber-300 hover:text-yellow-100 hover:underline text-lg transition-colors"
                    >
                    {contact.email}
                    </a>
                </div>
                <div>
                    <p className="text-white">Phone</p>
                    <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="text-amber-300 hover:text-yellow-100 hover:underline text-lg transition-colors"
                    >
                    {contact.phone}
                    </a>
                </div>
                </div>
            </section>

            {/* Google 地圖區塊 */}
            <section>
                {/* <h2 className="text-xl font-semibold border-b border-white pb-2 mb-4 text-yellow-200">公司位置</h2> */}
                <div className="w-full overflow-hidden rounded-lg shadow-lg shadow-amber-900/30">
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3691.181746468746!2d114.2246467!3d22.308965199999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x34040165bbb92f73%3A0xa60c44487bd76eeb!2z5rC46IiI5bel5qWt5aSn5buI!5e0!3m2!1szh-TW!2shk!4v1783921874722!5m2!1szh-TW!2shk"
                    width="100%"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                />
                </div>
            </section>
        </div>
    </div>
  );
}