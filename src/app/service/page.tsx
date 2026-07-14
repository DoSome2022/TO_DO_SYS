import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

// 統一全域字型配置 (與 layout / about 完全一致)
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
  title: "服務項目 | LOVELY PLUS 專業影視製作",
  description: "戲劇製作、電視節目、廣告拍攝、動畫設計、360°VR全景拍攝、Matterport 3D立體空間製作",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function ServicePage() {
  // 影片製作服務分類
  const videoServices = [
    "DRAMA 戲劇製作",
    "TV SHOWS 電視節目",
    "TV COMMERCIAL 廣告拍攝",
    "MUSIC VIDEOS 音樂錄影帶",
    "EVENTS & LIVE 活動直播",
  ];

  return (
    <div className="bg-black min-h-dvh">
      <div className={`${geistSans.variable} ${geistMono.variable} antialiased max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24`}>
        
        {/* 頁面頂部標題區 - 漸變設計 + 副標題 */}
        <header className="mb-20 text-center md:text-left">
          <p className="text-amber-500 tracking-[0.3em] text-sm mb-4 uppercase">Our Professional Services</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
            全方位影視製作服務
          </h1>
          <p className="text-amber-100/70 max-w-2xl text-base md:text-lg leading-relaxed">
            LOVELY PLUS 擁有專業影視製作團隊，深耕香港影視產業多年，為各大品牌、企業、機構提供高質量拍攝、動畫、VR全景定製服務，打造專屬視覺影像價值。
          </p>
        </header>

        {/* 1. 影片製作區塊 - 卡片設計 */}
        <section className="mb-24">
          <div className="group relative border border-amber-900/40 rounded-2xl p-8 md:p-12 bg-black/50 backdrop-blur-sm hover:border-amber-500/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            {/* 裝飾光影層 */}
            <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-amber-500/5 rounded-2xl blur-3xl group-hover:bg-amber-500/10 transition-all duration-500"></div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-200 mb-6 relative z-10">
              VIDEOS PRODUCTION 影片製作
            </h2>

            {/* 服務標籤列表 */}
            <div className="flex flex-wrap gap-3 mb-10 relative z-10">
              {videoServices.map((item, idx) => (
                <span 
                  key={idx} 
                  className="px-4 py-2 bg-amber-900/20 border border-amber-700/50 rounded-full text-amber-300 text-sm hover:bg-amber-600/20 hover:text-yellow-100 transition-all duration-300"
                >
                  {item}
                </span>
              ))}
            </div>

            {/* 品牌案例介紹 */}
            <div className="text-amber-100/80 space-y-4 leading-loose relative z-10">
              <p>
                LO＋VELY 深度參與香港影視產業，曾協助製作 VIU TV 熱門節目《阿美利堅有外星人》、《婚姻五重奏》，並獨立監製出品《職時交換》，累積豐富的影視項目執行經驗。
              </p>
              <p>
                長期為各大知名品牌、企業及公營機構提供定製化影像拍攝服務，合作客戶涵蓋美肌之誌、雞仔嘜、匯豐銀行 HSBC、星展銀行 DBS、香港公開大學 OUHK 等，按需提供多元化影像解決方案。
              </p>
            </div>
          </div>
        </section>

        {/* 2. 動畫製作區塊 */}
        <section className="mb-24">
          <div className="group relative border border-amber-900/40 rounded-2xl p-8 md:p-12 bg-black/50 backdrop-blur-sm hover:border-amber-500/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-amber-500/5 rounded-2xl blur-3xl group-hover:bg-amber-500/10 transition-all duration-500"></div>

            <h2 className="text-2xl md:text-3xl font-bold text-yellow-200 mb-6 relative z-10">
              ANIMATIONS 專業動畫製作
            </h2>

            <div className="text-amber-100/80 leading-loose relative z-10">
              <p>
                因應市場數位轉型趨勢，我司拓展專業動畫設計與製作業務，擁有成熟的動畫製作流程與設計團隊。先後為政府資訊科技辦公室、香港地球之友、星展銀行 DBS 等機構定制高品質動畫短片，適用於品牌宣傳、政策推廣、產品介紹、企業科普等多場景使用。
              </p>
            </div>
          </div>
        </section>

        {/* 3. 360°VR / 3D 全景拍攝 - 雙欄卡片設計 */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-200 mb-10 pb-4 border-b border-amber-800/60">
            360°VR & MATTERPORT 3D 全景技術
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 360°VR 全景拍攝 */}
            <div className="group border border-amber-900/40 rounded-2xl p-8 bg-black/50 backdrop-blur-sm hover:border-amber-500/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <h3 className="text-xl font-semibold text-yellow-300 mb-5">360° VR 全景拍攝</h3>
              <p className="text-amber-100/80 leading-loose">
                採用專業級360°全景攝影器材，支持室內外全場景拍攝，包含婚禮場地、室內設計空間、戶外活動、海底場景等特殊場地。無縫還原現場真實環境，搭配獨家360°實景音效，用戶可透過手機、VR眼鏡沉浸式觀看，打造身臨其境的視聽體驗。
              </p>
            </div>

            {/* Matterport 3D 立體建模 */}
            <div className="group border border-amber-900/40 rounded-2xl p-8 bg-black/50 backdrop-blur-sm hover:border-amber-500/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <h3 className="text-xl font-semibold text-yellow-300 mb-5">Matterport 3D 立體建模</h3>
              <p className="text-amber-100/80 leading-loose">
                運用最新紅外線掃描技術，高精度還原室內空間結構，生成360°立體模型與平面施工圖。支持第一視角點擊導覽，可通過手機、電腦、平板隨時瀏覽，廣泛應用於樓盤展示、商鋪空間、展廳、寫字樓等場景，為企業打造數位化線上空間展覽。
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
