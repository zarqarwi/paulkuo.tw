# paulkuo.tw 開發日誌

> 配合《Paul 個人品牌與社群自動化系統 v3》的網站建設紀錄。
> 這份日誌是社群發文的素材來源，每個階段都對應品牌系統的具體實踐。

---

## 專案概覽

| 項目 | 內容 |
|------|------|
| 網站 | [paulkuo.tw](https://paulkuo.tw) |
| 定位 | Rebuilding Order in an Age of Intelligence |
| 核心框架 | 道成肉身 — 秩序必須落地，技術必須入世 |
| 技術棧 | Astro + Cloudflare Pages |
| 品牌五柱 | 智能與秩序 · 再生系統 · 文明與人性 · 創造與建構 · 沉思與記憶 |
| Repo | [github.com/zarqarwi/paulkuo.tw](https://github.com/zarqarwi/paulkuo.tw) |

---

## Phase 0：初始部署（2026-02-19 上午）

**做了什麼：** 把 paulkuo.tw v5 靜態網站推上 GitHub，透過 Cloudflare Pages 完成自動部署。

**關鍵 commit：**
- `8d535c4` — init（repo 建立）
- `8222d57` — deploy: paulkuo.tw v5（完整靜態網站上線）

**對應 v3 品牌系統：** 2.1 技術基底建立 — Cloudflare Pages 部署，自訂域名綁定。

**社群切角：**
> 個人網站不是名片，是思想的錨點。當你需要一個不被演算法控制的地方來放你的觀點，自架網站是最基本的數位主權。

---

## Phase 1：內容重定位 — 從 AI 中心轉向秩序建構者（2026-02-19 上午）

**做了什麼：** 全站內容大改。Hero 標題從 AI 主題轉向「Rebuilding Order in an Age of Intelligence」，Manifesto 對齊道成肉身哲學，移除所有公司名（SDTI）和半導體標籤，修正 8 個社群連結。

**關鍵 commit：**
- `660069a` — Major content update: Reposition from AI-centric to Order Builder

**具體變更：**
- Hero title → "Rebuilding Order in an Age of Intelligence"
- Manifesto 加入 Logos/Christ、Sarx/Jesus 神學用語
- 辯論引擎移除 NT$5 定價 → 重新定位為認知基礎設施
- About timeline 移除 SDTI → 改為「台日跨域合作與產業橋接」
- 修正 Threads/YouTube/Facebook/Instagram/Bluesky/Reddit 連結
- Contact form 加入 mailto fallback

**對應 v3 品牌系統：** 1.1 品牌核心敘事、1.3 五柱十字結構落地。

**社群切角：**
> 花了一整個早上把網站從「AI 從業者的作品集」改成「一個秩序建構者的思想基地」。差別在哪？前者是追著趨勢跑，後者是提出自己的問題。技術是手段，秩序才是目的。

---

## Phase 2：多語系統建置（2026-02-19 中午）

**做了什麼：** 建立完整的 i18n 系統，支援繁中/簡中/英文/日文四語切換。採用兩層架構：靜態 JSON 翻譯檔（99% 場景）+ DeepL API 即時翻譯（1% 缺漏鍵值）。

**關鍵 commit：**
- `da1a962` — feat: add i18n translation JSON files (zh-TW, zh-CN, en, ja)
- `dd7ed2a` — feat: implement API-driven i18n system
- `4992e20` — Complete i18n system: refactored index.html + en/ja translations
- `ff50381` — Complete i18n system: 129 data-i18n attributes
- `9105037` — refactor: extract CSS to style.css, add 129 data-i18n attributes

**技術細節：**
- 129 個 data-i18n 屬性標記
- 4 組語言檔，每組 150+ 鍵值
- Cloudflare Pages Function 作為 DeepL 代理（伺服器端 key）
- localStorage 快取語言偏好
- html[lang] 屬性驅動字體切換

**對應 v3 品牌系統：** 2.5 多語內容管線 — 台日商務溝通的基礎建設。

**社群切角：**
> 為什麼個人網站要做四語支援？因為我的讀者和合作對象分佈在台灣、日本、和英語世界。語言不只是翻譯，是尊重——你用對方的語言說話，信任成本立刻降低一半。

---

## Phase 3：全站語氣校準（2026-02-19 下午）

**做了什麼：** 四輪文字校準，從「功能描述」提升到「文明尺度」的思想敘事。Timeline 從職涯履歷改成思想演進史，Feed 從新聞摘要改成思考實驗記錄，Pillar 描述從領域說明改成問題意識。

**關鍵 commit：**
- `13b6ba6` — Site-wide tone alignment: unified to civilization scale
- `aceb762` — 全站語氣層級校準：timeline 思想演進化、feed 思考實驗化
- `091b042` — About 主文重寫：去公司名、強化思想演進敘事
- `34d0e8f` — About p3 重寫 + 新增 p4：技術與尊嚴的張力
- `777fe34` — Timeline 反轉為正序 + 文字重寫為思想演進敘事
- `c2fc4c7` — content: update manifesto body — Logos/Christ, Sarx/Jesus wording

**設計原則：** 全站任何一段文字都應該回答同一個問題——「在系統重組的過程中，人的判斷力、創造力與尊嚴，如何不被效率的邏輯吞噬。」

**對應 v3 品牌系統：** 1.2 寫作風格 DNA（金句開場、犬儒批判、口語化深度）、2.8 AI × Human 雙讀者寫作框架。

**社群切角：**
> 網站的文字改了四輪。不是在磨詞彙，是在校準語氣——你到底是在描述自己做了什麼，還是在提出你認為重要的問題？前者是履歷，後者是主張。個人品牌的本質不是「我很厲害」，是「我在乎什麼」。

---

## Phase 4：視覺呈現優化（2026-02-19 下午）

**做了什麼：** 個人照從 placeholder 換成實際照片，反覆調整裁切比例和顯示方式。Five Pillars 從 about-grid 內移出為全寬獨立區塊，改為五欄排列。

**關鍵 commit：**
- `f322b9d` — 加入 Paul 個人照取代 PK placeholder
- `608f5e3` — 更換個人照為有更多背景的版本
- `5b9a123` — 替換照片為 paulkuo_new.png + 移除 scale transform
- `1c329d2` — 照片改用 contain 顯示完整比例
- `b71a43d` — Five Pillars 移出 about-grid 為全寬獨立區塊 + 五欄排列
- `d5a2875` — 移除 Five Pillars 標題文字
- （另有 6 個 commit 為照片比例微調）

**對應 v3 品牌系統：** 2.3 視覺識別系統 — 照片選擇反映人格定位（有背景脈絡的照片 > 純大頭照）。

**社群切角：**
> 為了一張照片的比例調了九個 commit。不是完美主義，是因為個人網站的照片傳遞的不只是「這個人長什麼樣」，而是「這個人怎麼看自己」。留白多一點，人小一點，環境大一點——我不是主角，問題才是。

---

## Phase 5：Astro 遷移 + 內容系統建置（2026-02-19 晚間 ～ 2026-02-20）

**做了什麼：** 從純靜態 HTML 遷移到 Astro 框架。建立 content collection 系統，匯入 55+ 篇文章（含英文和日文翻譯），實作自動翻譯工作流。

**目前架構：**
- `src/content/articles/` — 55+ 篇繁中原文（.md）
- `src/content/articles/en/` — 英文翻譯
- `src/content/articles/ja/` — 日文翻譯
- `src/i18n/ui.ts` — UI 字串多語管理
- `translations/` — 四語 JSON 翻譯檔
- `src/pages/index.astro` — 首頁（從 content collection 動態拉取文章）
- `scripts/translate-article.mjs` — 文章翻譯腳本
- `.github/workflows/translate.yml` — GitHub Actions 自動翻譯流程

**對應 v3 品牌系統：** 2.4 內容管線自動化 — Astro content collection 讓文章成為可程式化的結構化資料，為 Machine-readable Authority Layer 打基礎。

**社群切角：**
> 把網站從靜態 HTML 搬到 Astro，不是為了追技術潮流，是為了讓每篇文章都是「結構化的思想單元」。標題、摘要、五柱分類、日期、平台來源——這些 metadata 不只是給人看的，也是給 AI agent 讀的。在 AI 開始幫人找答案的時代，你的思想如果沒有結構，就等於不存在。

---

## Phase 6：聯繫區塊文案更新（2026-02-20 晚間）

**做了什麼：** 更新 Contact 區塊文案，從功能描述改為邀請對話。

**影響範圍：** 4 個檔案同步更新（ui.ts、zh-TW.json、index.astro、index.html）

**關鍵 commit：**
- `9e8713a` — fix: restore and update contact text

**對應 v3 品牌系統：** 1.4 CTA 設計 — 從「我提供服務」轉向「我們一起探索」，降低對話門檻。

**社群切角：**
> Contact 區塊的文案改了一句話，但背後是定位的轉變：從「我是顧問，有問題來找我」變成「我在思考這些問題，你也在的話，我們聊聊」。個人品牌的終極 CTA 不是銷售，是共鳴。

---

## 待辦 & 下一步

### S 級（最高優先）
- [ ] 撰寫 4-5 篇旗艦文章上線（道成肉身 AI 論述、循環經濟實戰、多模型認知框架...）
- [ ] 文章頁面 Article schema (JSON-LD) 結構化資料

### A 級
- [ ] Person schema 完善（sameAs、knowsAbout 擴充）
- [ ] Topic Clustering — 五柱 × 文章的交叉索引頁面
- [ ] Live Feed 接入真實社群 API（目前為靜態內容）
- [ ] OG image 自動生成（每篇文章的社群分享圖）

### B 級
- [ ] 文章搜尋功能
- [ ] RSS feed 輸出
- [ ] 深色模式完善
- [ ] 效能優化（圖片 lazy load、字體子集化）

---

## 技術備忘

**部署流程：** push to main → Cloudflare Pages 自動建置 → ~30 秒上線

**GitHub MCP 工具限制：**
- `push_files` 傳空字串會清空檔案（已踩坑）
- `create_or_update_file` 有 ~15KB 大小限制
- 大型檔案變更建議走本機 git push

**翻譯管線：** `scripts/translate-article.mjs` 使用 DeepL API，觸發條件見 `translate.yml`

---

*最後更新：2026-02-20*
