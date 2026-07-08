
> 
> ```markdown
> # 報價單（Quotation）系統完整分析報告
> 
> > **專案**：Next.js 16 + tRPC + Prisma + PostgreSQL  
> > **日期**：2026-07-08  
> > **目的**：盤點報價單系統現狀、缺失功能、後續開發計畫
> 
> ---
> 
> ## 目錄
> 
> - [1. 系統架構總覽](#1-系統架構總覽)
> - [2. Prisma Model 完整分析](#2-prisma-model-完整分析)
> - [3. tRPC Router 現狀分析](#3-trpc-router-現狀分析)
> - [4. Client Side 現狀分析](#4-client-side-現狀分析)
> - [5. 缺失功能完整清單](#5-缺失功能完整清單)
> - [6. 核心業務邏輯設計](#6-核心業務邏輯設計)
> - [7. 開發計畫與優先級](#7-開發計畫與優先級)
> - [8. 資料夾結構建議](#8-資料夾結構建議)
> 
> ---
> 
> ## 1. 系統架構總覽
> 
> ```
> ┌──────────────────────────────────────────────────────────────────┐
> │                        Quotation 系統                             │
> ├──────────────────────────────────────────────────────────────────┤
> │                                                                  │
> │  ┌───────────────────┐                                           │
> │  │   Quotation (主表) │──1:N── QuotationItem (報價明細)            │
> │  │   (status/price)  │──1:N── QuotationVersion (版本歷史+快照)    │
> │  │                   │──1:N── InternalQuoteMessage (內部對話)      │
> │  │                   │──1:N── ExternalQuoteMessage (外部對話)      │
> │  │                   │──1:1── Project (轉專案)                    │
> │  │                   │──1:N── Invoice (收據)                     │
> │  └───────────────────┘                                           │
> │         │                                                        │
> │         ├── CompanyProfile (公司抬頭)                             │
> │         └── Service (預定義服務庫) ←── QuotationItem              │
> │                                                                  │
> │  ┌───────────────────┐                                           │
> │  │  WON → CONVERTED  │──→ Project + WorkItem (自動產生)           │
> │  └───────────────────┘                                           │
> │                                                                  │
> └──────────────────────────────────────────────────────────────────┘
> ```
> 
> ---
> 
> ## 2. Prisma Model 完整分析
> 
> ### 2.1 已完整定義的 Model ✅
> 
> | Model | 行號 | 狀態 | 用途 |
> |-------|------|------|------|
> | `Quotation` | 950-999 | ✅ 完整 | 報價單主表，含四層價格、狀態、人員關聯 |
> | `QuoteStatus` | 1001-1008 | ✅ 完整 | DRAFT / NEGOTIATING / WON / LOST / CANCELLED / CONVERTED |
> | `QuotationItem` | 1145-1158 | ✅ 完整 | 報價明細，可關聯 Service 或自訂名稱 |
> | `QuotationVersion` | 1181-1206 | ✅ 完整 | 版本歷史 + JSON 快照 + 版號控制 |
> | `Service` | 1129-1143 | ✅ 完整 | Admin 預定義服務項目庫 |
> | `CompanyProfile` | 1114-1127 | ✅ 完整 | 多公司抬頭支援 |
> | `InternalQuoteMessage` | 1038-1050 | ✅ 完整 | 內部對話（Admin ↔ Sales） |
> | `ExternalQuoteMessage` | 1053-1068 | ✅ 完整 | 外部對話（Sales ↔ Customer） |
> | `QuoteMessage` | 1016-1028 | ⚠️ 舊版 | 可能已棄用，被上面兩個取代 |
> | `Invoice` | 1370-1414 | ✅ 完整 | 收據，可關聯 Quotation |
> | `WorkItem` | 378-410 | ✅ 完整（但需擴充） | 專案工作任務，需新增來源標記欄位 |
> 
> ### 2.2 Quotation Model 欄位詳解
> 
> ```prisma
> model Quotation {
>   id            String   @id @default(cuid())
>   number        String?  @unique          // 報價單編號 (Q-2026-0001)
>   title         String                    // 報價標題
>   status        QuoteStatus @default(NEGOTIATING)
>   validUntil    DateTime?                 // 有效期限
>   note          String?  @db.Text         // 備註
> 
>   // ── 人員關聯 ──
>   customerId    String
>   customer      Customer
>   salesId       String
>   sales         User     @relation("SalesQuotations")
> 
>   // ── 四層價格體系 ──
>   baseCost      Decimal?   // Admin 底線成本
>   agreedCost    Decimal?   // Admin ↔ Sales 內部價
>   customerPrice Decimal?   // Sales 報給客戶價
>   pmBudget      Decimal?   // 轉專案後 PM 預算
> 
>   // ── 轉專案 (1:1) ──
>   projectId     String?  @unique
>   project       Project?
> 
>   // ── 版本管理 ──
>   versions        QuotationVersion[]
>   currentVersionId String?
> 
>   // ── 對話 ──
>   internalMessages InternalQuoteMessage[]
>   externalMessages ExternalQuoteMessage[]
> 
>   // ── 公司抬頭 ──
>   companyProfileId String?
>   companyProfile   CompanyProfile?
> 
>   // ── 明細與總金額 ──
>   totalAmount   Decimal  @default(0)
>   items         QuotationItem[]
>   Invoice       Invoice[]
> }
> ```
> 
> ### 2.3 四層價格體系
> 
> ```
> baseCost (底線成本)    → Admin 才知道
>     ↓
> agreedCost (內部價)    → Admin + Sales 討論結果
>     ↓
> customerPrice (客戶價) → Sales 報給客戶的價格
>     ↓
> pmBudget (PM預算)      → 轉專案後 PM 可運用的資金
> ```
> 
> ### 2.4 狀態機流轉
> 
> ```
> DRAFT ──→ NEGOTIATING ──→ WON ──→ CONVERTED (轉專案)
>                 │             │
>                 │             └──→ LOST
>                 │
>                 └──→ CANCELLED
> ```
> 
> ### 2.5 QuotationVersion — 版本快照機制（核心）
> 
> ```prisma
> model QuotationVersion {
>   id              String    @id @default(cuid())
>   versionNumber   Int                    // 版號 (v1, v2, v3...)
>   title           String                 // 當時的標題
>   status          QuoteStatus
>   baseCost        Decimal?
>   agreedCost      Decimal?
>   customerPrice   Decimal?
>   pmBudget        Decimal?
>   totalAmount     Decimal   @default(0)
>   notes           String?
>   isLatest        Boolean   @default(false)  // 標記最新版本
>   changeLog       String?                    // "調降客戶報價 20%"
> 
>   quotationId     String
>   quotation       Quotation
> 
>   snapshot        Json    // 🏆 完整報價單 JSON 快照
> 
>   @@unique([quotationId, versionNumber])
>   @@index([quotationId, isLatest])
> }
> ```
> 
> > `snapshot: Json` 是版本管理的核心。每次儲存版本時，把當下的 title、items[]、customerPrice、note 等全部序列化為 JSON 儲存。回滾時直接讀取這個 JSON 覆蓋當前報價單即可。
> 
> ### 2.6 WorkItem — 需擴充的欄位
> 
> ```prisma
> model WorkItem {
>   // ... 現有欄位（378-410 行）...
> 
>   // 🆕 新增：來源標記（知道這個任務是從報價單來的）
>   source                  String?   // "QUOTATION" | "MANUAL" | "TODO"
>   sourceQuotationItemId   String?   // 對應的 QuotationItem.id
>   sourceQuotationItemNote String?   // "因報價單修改而暫停，請PM確認"
> 
>   // 🆕 新增：暫停狀態
>   suspendReason           String?   // 暫停原因（非 null 表示暫停中）
> }
> ```
> 
> ---
> 
> ## 3. tRPC Router 現狀分析
> 
> ### 3.1 ✅ 已實作
> 
> | Procedure | 功能 | 備註 |
> |-----------|------|------|
> | `quotation.getQuotations` | 列表查詢（含權限過濾） | 可依 status 篩選、分頁 |
> | `quotation.getQuotationById` | 單筆查詢（含關聯資料） | 含 customer, sales, project, messages |
> | `quotation.getSalesStats` | Sales 統計數據 | 總數/贏單數/成交額 |
> | `quotation.createQuotation` | 新增報價單 | 使用 `createQuotationSchema` |
> | `quotation.updateQuotation` | 編輯報價單 | **目前只能改 title + customerPrice** |
> | `quotation.updateQuotationStatus` | 變更狀態 | WON / LOST |
> | `quotation.sendInternalMessage` | 發送內部對話 | Admin ↔ Sales |
> | `quotation.sendExternalMessage` | 發送外部對話 | Sales ↔ Customer |
> 
> ### 3.2 ❌ 缺失的 tRPC Procedure
> 
> #### 🔴 第一優先：報價明細管理（QuotationItem CRUD）
> 
> ```typescript
> // 完全不存在 ❌
> quotation.addItem         // 新增服務項目到報價單
> quotation.updateItem      // 修改報價單中的項目（數量/單價/名稱）
> quotation.removeItem      // 從報價單移除服務項目
> quotation.reorderItems    // 重新排序項目
> ```
> 
> #### 🔴 第二優先：版本管理（QuotationVersion）
> 
> ```typescript
> // 完全不存在 ❌
> quotation.getVersions         // 取得版本歷史列表
> quotation.createVersion       // 建立新版本（快照當前內容）
> quotation.revertToVersion     // 回滾到指定版本
> quotation.compareVersions     // 比較兩個版本差異
> ```
> 
> #### 🔴 第三優先：報價單 ↔ 專案任務同步
> 
> ```typescript
> // 完全不存在 ❌
> // WON → CONVERTED 時自動將 items 轉為 WorkItem
> // 報價單修改後同步更新對應 WorkItem
> // 報價單刪除項目 → WorkItem 標記「因報價修改而暫停」
> ```
> 
> ---
> 
> ## 4. Client Side 現狀分析
> 
> ### 4.1 ✅ 已實作
> 
> | 元件 | 功能 | 備註 |
> |------|------|------|
> | `QuotationListClient` | 報價單列表 + 狀態篩選 + 新增按鈕 | 有 Dialog 彈窗顯示詳情 |
> | `QuotationDetailClient` | 報價單詳情 + 編輯 title/price + 對話 | 雙通道對話正常運作 |
> | `QuotationCard` | 列表中的卡片樣式 | — |
> | `CreateQuotationDialog` | 新增報價單表單 | — |
> | `SalesQuotationsList` | Sales Dashboard 中的列表 | — |
> 
> ### 4.2 ❌ 缺失的 UI 元件
> 
> | 元件 | 功能 | 優先級 |
> |------|------|--------|
> | 報價明細管理 UI | 在詳情頁中新增/編輯/刪除 Service 項目 | **P0 🔥** |
> | 版本時間軸元件 | 顯示版本歷史、當前版本、可點擊切換 | **P1 ⚡** |
> | 版本回滾對話框 | 選擇目標版本 → 預覽 → 確認回滾 | **P1 ⚡** |
> | 版本差異比較 UI | 對比兩個版本的內容差異 | P2 🟡 |
> | WorkItem 同步標記 | 顯示「因報價單修改而暫停」標籤 | P2 🟡 |
> 
> ---
> 
> ## 5. 缺失功能完整清單
> 
> ### 5.1 功能缺口總表
> 
> | ID | 類別 | 功能 | 目前狀態 | 目標狀態 | 依賴 |
> |----|------|------|---------|---------|------|
> | **F1** 🔥 | tRPC | `addItem` — 新增服務到報價單 | ❌ 無 | ✅ 有 | — |
> | **F2** 🔥 | tRPC | `updateItem` — 修改報價項目 | ❌ 無 | ✅ 有 | — |
> | **F3** 🔥 | tRPC | `removeItem` — 刪除報價項目 | ❌ 無 | ✅ 有 | — |
> | **F4** 🔥 | UI | 報價明細管理操作介面 | ❌ 無 | ✅ 有 | F1-F3 |
> | **F5** ⚡ | tRPC | `createVersion` — 建立版本快照 | ❌ 無 | ✅ 有 | F1-F4 |
> | **F6** ⚡ | tRPC | `getVersions` — 版本歷史列表 | ❌ 無 | ✅ 有 | — |
> | **F7** ⚡ | tRPC | `revertToVersion` — 回滾到指定版本 | ❌ 無 | ✅ 有 | F5-F6 |
> | **F8** ⚡ | UI | 版本時間軸 + 回滾確認 | ❌ 無 | ✅ 有 | F5-F7 |
> | **F9** 🟡 | tRPC | WON→CONVERTED 自動轉 WorkItem | ❌ 無 | ✅ 有 | — |
> | **F10** 🟡 | tRPC | 報價修改 → 同步 WorkItem + 標記暫停 | ❌ 無 | ✅ 有 | F9 |
> | **F11** 🟡 | UI | WorkItem 暫停標籤顯示 | ❌ 無 | ✅ 有 | F10 |
> 
> ### 5.2 依賴關係圖
> 
> ```
> F1 (addItem) ──┐
> F2 (updateItem)─┤
> F3 (removeItem)─┼── F4 (UI: 明細管理) ── F5 (createVersion) ──┐
>                 │                                               │
> F6 (getVersions)───────────────────────────────────────────────┼── F7 (revertToVersion) ── F8 (UI: 版本管理)
>                                                                 │
> F9 (WON→WorkItem) ── F10 (同步標記) ── F11 (UI標籤) ──────────┘
> ```
> 
> ---
> 
> ## 6. 核心業務邏輯設計
> 
> ### 6.1 版本管理的正確做法
> 
> 你提到的關鍵場景：**「客人在第10版，要回到第6版，再加東西」**
> 
> ```
> v1 ─→ v2 ─→ v3 ─→ v4 ─→ v5 ─→ v6 ─→ v7 ─→ v8 ─→ v9 ─→ v10 (當前)
>                                                         
>       客戶說：「回到第6版那個方案」                       
>                      │                                   
>                      ▼                                   
>         讀取 v6 的 snapshot (JSON)                      
>                      │                                   
>         用 v6 的內容覆蓋當前 Quotation                   
>         (title, items[], customerPrice, note...)         
>                      │                                   
>         建立 v11 (versionNumber = 11)                    
>         snapshot = v6 當時的內容                         
>         changeLog = "回滾至第6版方案，作為新起點"          
>         isLatest = true                                  
>                      │                                   
>         Sales 可以在 v11 上加東西、改東西                 
>         (繼續建立 v12, v13...)                           
> ```
> 
> **關鍵原則**：
> - ✅ 永不刪除歷史版本（唯讀保護）
> - ✅ 回滾 = 複製舊版內容 → 建立新版本
> - ✅ 版本號永遠遞增（v1 → v2 → ... → v10 → v11）
> - ✅ `snapshot: Json` 保留當時的完整報價單內容
> 
> ### 6.2 版本快照的 JSON 結構建議
> 
> ```json
> {
>   "version": 6,
>   "title": "某公司官網建置案 - 方案B",
>   "customerPrice": 150000,
>   "note": "不含主機代管費用",
>   "items": [
>     {
>       "serviceId": "xxx",
>       "customName": "UI/UX 設計",
>       "quantity": 1,
>       "unitPrice": 50000,
>       "subtotal": 50000
>     },
>     {
>       "serviceId": null,
>       "customName": "前台開發 (React)",
>       "quantity": 1,
>       "unitPrice": 80000,
>       "subtotal": 80000
>     }
>   ],
>   "companyProfileId": "yyy",
>   "createdAt": "2026-05-20T10:00:00Z"
> }
> ```
> 
> ### 6.3 報價單 ↔ 專案任務同步邏輯
> 
> ```
> Quotation WON → CONVERTED
>         │
>         ▼
> 建立 Project (從報價單複製 title/customerPrice/pmBudget)
>         │
>         ▼
> 針對每個 QuotationItem 建立對應的 WorkItem
>   ├── title = QuotationItem.customName (或 Service.name)
>   ├── projectId = 新建立的 Project.id
>   ├── source = "QUOTATION"
>   ├── sourceQuotationItemId = QuotationItem.id
>   └── status = PENDING (待PM指派)
> 
>         │
>         ▼
> 之後報價單被修改 (revertToVersion / addItem / removeItem)
>         │
>         ▼
> 檢查對應的 WorkItem：
>   ├── 被刪除的項目 → WorkItem 標記：
>   │   status = "SUSPENDED"
>   │   suspendReason = "⚠️ 因報價單修改而暫停，請PM確認"
>   │
>   ├── 新增的項目 → 新增 WorkItem：
>   │   status = "PENDING"
>   │   note = "📋 來自報價單的新增項目"
>   │
>   └── 修改的項目 → 在 WorkItem 加上備註：
>       note += "\n⚠️ 報價單內容已修改，請確認是否沿用"
> ```
> 
> ### 6.4 需要新增的 Zod Schema
> 
> ```typescript
> // lib/schemas/quotation.ts  — 需要新增的內容
> 
> // 🆕 報價明細 schema（前端表單用）
> export const quotationFormItemSchema = z.object({
>   serviceId: z.string().optional().nullable(),
>   customName: z.string().min(1, '名稱為必填'),
>   quantity: z.number().int().min(1, '數量至少為1'),
>   unitPrice: z.number().min(0, '單價不能為負數'),
>   subtotal: z.number().min(0),
> });
> 
> // 🆕 新增項目到報價單
> export const addItemSchema = z.object({
>   quotationId: z.string(),
>   serviceId: z.string().optional().nullable(),
>   customName: z.string().min(1, '名稱為必填'),
>   quantity: z.number().int().min(1).default(1),
>   unitPrice: z.number().min(0),
> });
> 
> // 🆕 更新報價項目
> export const updateItemSchema = z.object({
>   itemId: z.string(),
>   customName: z.string().optional(),
>   quantity: z.number().int().min(1).optional(),
>   unitPrice: z.number().min(0).optional(),
>   subtotal: z.number().min(0).optional(),
> });
> 
> // 🆕 刪除報價項目
> export const removeItemSchema = z.object({
>   itemId: z.string(),
>   quotationId: z.string(),
> });
> 
> // 🆕 建立版本
> export const createVersionSchema = z.object({
>   quotationId: z.string(),
>   changeLog: z.string().optional(),
> });
> 
> // 🆕 回滾版本
> export const revertToVersionSchema = z.object({
>   quotationId: z.string(),
>   targetVersionId: z.string(),
>   changeLog: z.string().optional(),
> });
> ```
> 
> ---
> 
> ## 7. 開發計畫與優先級
> 
> ### 第一階段：報價明細管理（P0 🔥）
> 
> ```
> 目標：讓 Sales 可以在報價單中自由增刪改 Service 項目
> 預估工時：3-5 天
> ```
> 
> | 步驟 | 內容 | 檔案 |
> |------|------|------|
> | 1 | 新增 Zod schema `addItemSchema` / `updateItemSchema` / `removeItemSchema` | `lib/schemas/quotation.ts` |
> | 2 | 新增 tRPC `quotation.addItem` | `server/routers/quotation.ts` |
> | 3 | 新增 tRPC `quotation.updateItem` | 同上 |
> | 4 | 新增 tRPC `quotation.removeItem` | 同上 |
> | 5 | 建立 `QuotationItemManager` 元件（嵌入 QuotationDetailClient） | `components/sales/quotations/QuotationItemManager.tsx` |
> | 6 | 建立 `QuotationItemDialog`（新增/編輯項目的 Dialog） | `components/sales/quotations/QuotationItemDialog.tsx` |
> | 7 | 整合到 `QuotationDetailClient` | `components/sales/quotations/QuotationDetailClient.tsx` |
> 
> ### 第二階段：版本管理（P1 ⚡）
> 
> ```
> 目標：版本快照、歷史檢視、回滾功能
> 預估工時：5-7 天
> ```
> 
> | 步驟 | 內容 | 檔案 |
> |------|------|------|
> | 1 | 新增 Zod schema `createVersionSchema` / `revertToVersionSchema` | `lib/schemas/quotation.ts` |
> | 2 | 新增 tRPC `quotation.createVersion` | `server/routers/quotation.ts` |
> | 3 | 新增 tRPC `quotation.getVersions` | 同上 |
> | 4 | 新增 tRPC `quotation.revertToVersion` | 同上 |
> | 5 | 建立 `VersionTimeline` 元件 | `components/sales/quotations/VersionTimeline.tsx` |
> | 6 | 建立 `RevertVersionDialog` 元件 | `components/sales/quotations/RevertVersionDialog.tsx` |
> | 7 | 整合到 `QuotationDetailClient` | `components/sales/quotations/QuotationDetailClient.tsx` |
> 
> ### 第三階段：專案任務同步（P2 🟡）
> 
> ```
> 目標：WON→CONVERTED 自動產生 WorkItem、後續同步
> 預估工時：5-8 天
> ```
> 
> | 步驟 | 內容 | 檔案 |
> |------|------|------|
> | 1 | Prisma: WorkItem 新增 `source` / `sourceQuotationItemId` / `suspendReason` 欄位 | `schema.prisma` |
> | 2 | 執行 migration | `npx prisma migrate dev` |
> | 3 | 修改 WON→CONVERTED 邏輯，自動產生 WorkItem | `server/routers/quotation.ts` |
> | 4 | 修改 addItem/removeItem/revertToVersion 同步 WorkItem | 同上 |
> | 5 | 在專案 WorkItem 列表顯示暫停標籤 | `components/WorkItemsViewer.tsx` |
> 
> ### 時間軸總覽
> 
> ```
> Week 1          Week 2          Week 3          Week 4
> ├───────────────┼───────────────┼───────────────┼───────────────┤
>  第一階段         第二階段         第三階段
>  (明細管理)       (版本管理)       (專案同步)
>                                                 
> F1-F4 🔥        F5-F8 ⚡        F9-F11 🟡
>                                                 
>          ↕               ↕               ↕
>    可讓 Sales      可追溯/回滾      報價與專案
>    增刪改項目      報價單版本       自動連動
> ```
> 
> ---
> 
> ## 8. 資料夾結構建議
> 
> ### 8.1 tRPC Router 結構
> 
> ```
> server/
> └── routers/
>     ├── quotation/                     ← 🆕 改為資料夾
>     │   ├── index.ts                   ← 主 router，組合各子 router
>     │   ├── quotation.crud.ts          ← 現有 CRUD（查詢/狀態/基本編輯）
>     │   ├── quotation.item.ts          ← 🆕 明細管理 (add/update/remove item)
>     │   ├── quotation.version.ts       ← 🆕 版本管理 (create/get/revert version)
>     │   └── quotation.project.ts       ← 🆕 專案同步 (convert/sync workitem)
>     └── quotation.ts                   ← 現有（可保留作為過渡，後續移除）
> ```
> 
> ### 8.2 Client Side 結構
> 
> ```
> components/
> └── sales/
>     └── quotations/
>         ├── QuotationListClient.tsx        ← 現有
>         ├── QuotationDetailClient.tsx      ← 現有（需擴充）
>         ├── QuotationCard.tsx              ← 現有
>         ├── CreateQuotationDialog.tsx      ← 現有
>         │
>         ├── QuotationItemManager.tsx       ← 🆕 項目管理區塊（嵌入詳情頁）
>         ├── QuotationItemDialog.tsx        ← 🆕 新增/編輯項目的對話框
>         │
>         ├── VersionTimeline.tsx            ← 🆕 版本時間軸元件
>         ├── VersionTimelineItem.tsx        ← 🆕 時間軸中的單個版本項目
>         ├── RevertVersionDialog.tsx        ← 🆕 回滾確認對話框
>         │
>         └── hooks/
>             ├── useQuotationItems.ts       ← 🆕 項目管理 hooks
>             └── useQuotationVersions.ts    ← 🆕 版本管理 hooks
> ```
> 
> ### 8.3 Schema 結構
> 
> ```
> lib/
> └── schemas/
>     └── quotation.ts   ← 現有，需擴充
> ```
> 
> ### 8.4 配套檔案變更一覽
> 
> | 檔案 | 變更類型 | 階段 |
> |------|---------|------|
> | `schema.prisma` — WorkItem 新增欄位 | ✏️ 修改 | 3 |
> | `lib/schemas/quotation.ts` — 新增 5 個 Schema | ✏️ 擴充 | 1+2 |
> | `server/routers/quotation.ts` — 新增 7 個 Procedure | ✏️ 擴充 | 1+2+3 |
> | `components/.../QuotationDetailClient.tsx` — 整合新 UI | ✏️ 修改 | 1+2 |
> | `components/.../QuotationItemManager.tsx` | 🆕 新增 | 1 |
> | `components/.../QuotationItemDialog.tsx` | 🆕 新增 | 1 |
> | `components/.../VersionTimeline.tsx` | 🆕 新增 | 2 |
> | `components/.../RevertVersionDialog.tsx` | 🆕 新增 | 2 |
> | `components/.../hooks/useQuotationItems.ts` | 🆕 新增 | 1 |
> | `components/.../hooks/useQuotationVersions.ts` | 🆕 新增 | 2 |
> | `components/WorkItemsViewer.tsx` — 顯示暫停標籤 | ✏️ 修改 | 3 |
> 
> ---
> 
> ## 附錄 A：Prisma Model 行號對照
> 
> | Model | 行號 | 行數 |
> |-------|------|------|
> | `WorkItem` | 378-410 | 33 行 |
> | `Quotation` | 950-999 | 50 行 |
> | `QuoteStatus` | 1001-1008 | 8 行 |
> | `QuoteMessage` | 1016-1028 | 13 行 |
> | `InternalQuoteMessage` | 1038-1050 | 13 行 |
> | `ExternalQuoteMessage` | 1053-1068 | 16 行 |
> | `CompanyProfile` | 1114-1127 | 14 行 |
> | `Service` | 1129-1143 | 15 行 |
> | `QuotationItem` | 1145-1158 | 14 行 |
> | `QuotationVersion` | 1181-1206 | 26 行 |
> | `Invoice` | 1370-1414 | 45 行 |
> 
> ## 附錄 B：現有 Schema 檔案內容
> 
> ```typescript
> // lib/schemas/quotation.ts（截至 2026-07-08）
> 
> import z from "zod";
> 
> // ✅ 已存在
> export const createQuotationSchema = z.object({
>   title: z.string(),
>   customerId: z.string(),
>   customerPrice: z.number(),
> });
> 
> // ✅ 已存在（注意拼寫有多一個 a）
> export const updateQuotataionSchema = z.object({
>   quotationId: z.string(),
>   title: z.string().optional(),
>   customerPrice: z.number().positive().optional(),
>   status: z.enum(["DRAFT", "NEGOTIATING", "WON", "LOST"]).optional(),
> });
> 
> // ✅ 已存在
> export const updateQuotationStatusSchema = z.object({
>   quotationId: z.string(),
>   status: z.enum(["DRAFT", "NEGOTIATING", "WON", "LOST"]),
> });
> ```
> 
> ---
> 
> > **報告結束**  
> > 
> ```
> 
> ---
> 
> 
> 
> 1. **系統架構總覽** — 圖解
> 2. **Prisma Model 完整分析** — 每個 Model 細節、四層價格、狀態機、版本快照、WorkItem 待擴充欄位
> 3. **tRPC Router 現狀** — 哪些有、哪些缺失（三大區塊）
> 4. **Client Side 現狀** — 現有元件 + 缺失元件
> 5. **缺失功能完整清單** — 11 項附依賴圖
> 6. **核心業務邏輯設計** — 版本回滾流程、JSON 快照結構、專案同步邏輯、新 Zod Schema
> 7. **開發計畫與優先級** — 三階段詳細步驟 + 時間軸
> 8. **資料夾結構建議** — 完整檔案清單 + 變更對照表
> 
>

-------------------

