# paulkuo.tw 全面體檢報告

**檢查日期：** 2026-03-06  
**架構：** Astro SSG → GitHub Actions CI/CD → Cloudflare Pages  
**規模：** 357+ 頁（82 篇文章 × 4 語言 + 功能頁面）  

---

## 一、整體評估

paulkuo.tw 經過多輪重構（CJK 排版、SEO、a11y、BaseLayout 元件拆分），已經從最初的單頁 HTML 進化成相當成熟的 Astro 多語站。但隨著功能不斷疊加（ticker bar、翻譯工具、Dashboard、社群 feed），部分區域出現了「功能堆積」的痕跡，需要一次整理性的回顧。

以下按六個維度逐項檢視，每項標注**嚴重度**（🔴 高 / 🟡 中 / 🟢 低）與**修復難度**（⚡ 簡單 / 🔧 中等 / 🏗 複雜）。

---

## 二、程式碼品質 (Code Quality)

### 🟡 首頁資訊密度過高 — `index.astro` 承載太多職責 🔧

目前首頁同時包含：hero、哲學宣言、文章列表、專案卡片、動態情報（ticker）、社群 feed（7 平台）、聯絡表單。單一頁面的 HTML 輸出量偏大，且 ticker bar 的即時數據（步數、API 費用、股價）在 SSG 架構下本質上是 build-time 快照，不是真正的 "即時"。

**建議：** 把 ticker 數據改為 client-side fetch（從 Cloudflare Worker 端點拉），搭配 skeleton loading。或者至少在 ticker 旁標註「資料更新於 build time」避免誤導。

### 🟡 社群 feed 區塊是硬編碼內容 🔧

從首頁 HTML 看，7 個平台的動態（Instagram / Facebook / YouTube / Reddit / Bluesky / LinkedIn / Threads / X）全部是靜態文字，最新一則還是 2026.02.19。訪客三月來看到二月的動態，觀感不好。

**建議：** 三個方向擇一——(a) 接 social-poster 的輸出自動更新，(b) build time 從 Google Sheets 拉最新貼文，(c) 直接拿掉改放「最近更新」時間戳就好。硬編碼的社群動態比沒有更糟，因為會顯得網站沒在維護。

### 🟡 語言切換器路徑邏輯疑慮 🔧

首頁的語言切換連結是 `/?lang=zh-CN`、`/?lang=en`、`/?lang=ja`，用 query parameter 切語言。但 Astro 的多語系是靠路徑（`/en/`、`/ja/`、`/zh-cn/`）來區分的。如果兩套機制並存，可能會造成 SEO 混淆（同一內容兩個 URL）或使用者點了沒反應。

**建議：** 統一成路徑式切換（`/en/`），query parameter 只做 fallback redirect。

### 🟢 版本號展示方式 🟢 ⚡

Ticker bar 顯示 `VER 2.12.0`。對你的目標受眾（BD 合作方、產業人士）來說，版本號沒有意義，反而佔掉寸土寸金的 ticker 空間。

**建議：** 移到 footer 或 `<meta>` tag 裡就好。

---

## 三、UI / UX 體驗

### 🔴 Persistent UI 四層夾擊 — 螢幕空間被壓縮 🔧

根據之前的實際檢查，同時出現在畫面上的固定元素有：sticky nav、ticker bar、右下角字體切換器（A-/A/A+）、左下角「繼續閱讀 進度 X%」。四層 persistent UI 在手機上會吃掉 30%+ 的可視區域。

**建議：**
- ticker bar 在手機上改為可收合（點一下展開/收起）
- 字體切換器移到 nav 的漢堡選單裡
- 閱讀進度條改為頂部薄線條（3px），不要佔據內容空間
- Smart Header（下滑隱藏、上滑浮現）之前討論過但不確定是否已實裝

### 🔴 社群動態區的「複讀機」問題 🔧

8 個平台顯示的是同一則內容的不同語言/格式版本（辯論引擎 v5.2 升級），訪客看到的就是同一句話重複八次。這反而削弱「多平台活躍」的說服力。

**建議：** 每個平台只顯示最新的一則，且確保內容不同。或者精選 2-3 個平台展示不同面向的內容（例如 X 放短觀點、LinkedIn 放專業分析、YouTube 放影片縮圖）。

### 🟡 首頁 Hero 的 CTA 層級不夠清晰 ⚡

Hero 區有五個 pillar 標籤（智能與秩序 / 循環再利用 / 文明與人性 / 創造與建構 / 沉思與記憶）加上兩個按鈕（閱讀思想 / 認識 Paul）。Pillar 標籤是否可點擊？如果可以，應該要有 hover 效果暗示互動性；如果不可以，不該長得像按鈕。

**建議：** 明確區分裝飾性標籤和可互動按鈕的視覺語言。

### 🟡 「專案」區只有 3 張卡片，其中 2 張指向同一個 /projects ⚡

阿哥拉廣場 → `/tools/translator/`（有實際功能），但 CircleFlow 和多模型認知協作框架都指向 `/projects`。如果 `/projects` 頁面沒有對應的獨立內容，這兩張卡片就是空殼。

**建議：** 沒有獨立頁面的專案，CTA 改成「即將推出」或直接拿掉，不要讓使用者點了卻看不到更多東西。

### 🟡 聯絡表單體驗 ⚡

表單只有 Email 和訊息欄位，缺少姓名。之前的 audit 有提過，從 HTML 看首頁確實有姓名欄位了（「姓名」），這部分已修復。但需要確認：表單送出後有沒有 loading state 和 success/error 回饋？之前有實作過 spinner + disabled state，需要驗證是否還在。

### 🟢 搜尋體驗 ⚡

點搜尋 icon 跳到 `/search` 獨立頁面。對使用者來說，一個 modal overlay 或 inline 搜尋會更流暢。如果已經整合 pagefind 或類似方案，建議改成 overlay 模式（按 Cmd+K 或點 icon 彈出）。

---

## 四、效能 (Performance)

### 🟡 Ticker bar 的數據是 build-time 快照 🔧

API 費用 $3.24、步數 1,189、AI 協作 2.8h、股價 ¥1,101 — 這些全部是上次 build 的數字。如果 crontab 每 10 分鐘跑 `auto_update_data.sh`，但 Cloudflare build 不一定每次都觸發，數據可能延遲數小時甚至數天。

**建議：** 高頻變動數據（步數、股價）改為 client-side fetch 從 Worker endpoint 即時拉。低頻數據（月 API 費用）可以保持 build-time。

### 🟡 封面圖片優化 ⚡

從 HTML 看，文章封面圖路徑是 `/images/covers/pope-leo-xiv-ai-homily.jpg` 等。需要確認：
- 是否已經用 Astro 的 `<Image>` 組件做自動 WebP 轉換和 srcset？
- 有沒有設 `width`/`height` 屬性避免 CLS？
- 有沒有 lazy loading（`loading="lazy"`）？

如果還是用原始 `<img>` tag，建議全面換成 Astro Image 組件。

### 🟢 字型載入策略 ⚡

有載入 Noto Sans SC/JP 和 Playfair Display + DM Sans。CJK 字型檔案大，需要確認是否有用 `font-display: swap` 和 `preload` 關鍵字型的 WOFF2 子集。

---

## 五、SEO & AI-Ready

### 🟢 已做到的（從之前工作確認）

- ✅ hreflang 四語言標籤
- ✅ JSON-LD @graph schema（Person + WebSite + Article）
- ✅ llms.txt + llms-full.txt
- ✅ 動態 OG image
- ✅ RSS feed
- ✅ ArticleCost.astro 生產成本追蹤
- ✅ WebMCP tools 配置
- ✅ Semantic HTML（article、time datetime、section aria-labelledby）

### 🟡 /articles/ 路徑與 /blog/ 不一致 ⚡

之前檢查發現 `/articles/` 直接導回首頁，文章列表在 `/blog/`。但文章的實際 URL 是 `/articles/slug`。路徑命名不一致影響使用者心智模型和 SEO 爬蟲理解。

**建議：** 統一成一套。要嘛列表頁也叫 `/articles/`，要嘛文章 URL 改成 `/blog/slug`。

### 🟡 社群 feed 區塊的 SEO 價值為零 ⚡

8 個平台的靜態貼文沒有結構化資料、沒有連結到原始貼文、沒有時間標記的 `<time>` tag。對搜尋引擎來說就是一堆無語境的文字。

**建議：** 每則動態加上 `<time datetime>` 和原始貼文的 `<a href>`。

---

## 六、無障礙 (Accessibility)

### 🟢 已完成的 a11y 改善（從之前的工作）

- ✅ nav aria-label
- ✅ 社群連結 `rel="noopener noreferrer"` + aria-label
- ✅ filter buttons aria-pressed
- ✅ focus-visible outline
- ✅ WCAG AA 對比度修正（`--text-muted` 提升到 4.54:1）
- ✅ 字體大小切換器

### 🟡 Ticker bar 的無障礙問題 ⚡

Ticker 的資訊（🚶 步數 1,189、⏱ AI 協作 2.8h）使用 emoji 作為 label。螢幕閱讀器會讀出 emoji 的全名（例如「walking person, steps, one thousand one hundred eighty-nine」），體驗混亂。

**建議：** 每個 ticker item 加 `aria-label="今日步數：1,189 步"` 並在 emoji 上加 `aria-hidden="true"`。之前有加 `title` attribute（Phase 3 tooltip），但 `title` 不被螢幕閱讀器一致支援。

### 🟡 語言切換器的 a11y ⚡

「繁 / 简 / EN / 日」四個連結，螢幕閱讀器使用者不知道這是語言切換。需要外層包 `<nav aria-label="語言切換">` 或 `role="navigation"`。

---

## 七、安全性 (Security)

### 🟡 聯絡表單缺少 bot 防護 🔧

之前討論過整合 Cloudflare Turnstile 但不確定是否已實裝。沒有 CAPTCHA 或 honeypot 的表單，遲早會收到垃圾信。

**建議：** Cloudflare Turnstile（免費）是最符合你架構的選擇，整合到 Worker 端驗證。

### 🟢 Input sanitization ⚡

確認表單的 Worker 端處理有做基本的輸入清理（strip HTML tags、限制長度）。

---

## 八、優先行動排序

按 **影響力 × 修復成本** 排序：

| 優先級 | 項目 | 嚴重度 | 難度 | 預估時間 |
|--------|------|--------|------|----------|
| 1 | 社群 feed 更新或移除硬編碼內容 | 🔴 | ⚡ | 30 min |
| 2 | Persistent UI 減壓（手機 ticker 收合 + 進度條改薄線） | 🔴 | 🔧 | 2 hr |
| 3 | Ticker 數據改 client-side fetch | 🟡 | 🔧 | 2 hr |
| 4 | /articles/ vs /blog/ 路徑統一 | 🟡 | 🔧 | 1 hr |
| 5 | 語言切換器路徑統一（query → path） | 🟡 | 🔧 | 1.5 hr |
| 6 | Ticker + 語言切換 a11y 修正 | 🟡 | ⚡ | 30 min |
| 7 | Cloudflare Turnstile 整合 | 🟡 | 🔧 | 1.5 hr |
| 8 | 圖片 WebP + srcset 優化 | 🟡 | 🔧 | 1 hr |
| 9 | 專案卡片 CTA 修正 | 🟡 | ⚡ | 15 min |
| 10 | 版本號移到 footer | 🟢 | ⚡ | 5 min |
| 11 | 搜尋改 overlay 模式 | 🟢 | 🔧 | 2 hr |

---

## 九、結語

網站的核心內容品質和品牌定位非常到位——「在舊秩序鬆動的時代，設計下一個能運作的系統」這個敘事很有力量，五大 pillar 的配色和文章品質都走在正確的方向上。

目前最大的「體感問題」是首頁的資訊過載：ticker bar + 社群 feed + 專案卡片 + 表單 + 宣言，一個首頁想講太多事。建議的思路是「減法設計」：讓首訪者在 5 秒內理解你是誰、你在做什麼，然後給一個清楚的 CTA 引導他們深入。過期的社群動態和靜態的 build-time 數據反而拖累了「超級個體」的印象。

技術基礎是紮實的，Astro + Cloudflare + GitHub Actions 的三件套跑得很順。下一步的重點應該放在「動態化」（讓 ticker 和 feed 真正即時）和「減壓」（手機體驗的 persistent UI 問題）。
